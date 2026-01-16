import { Router } from 'express'
import { AppDataSource } from '../config/database'
import { Conversation, Pdf, Message } from '../entities'
import { authenticate } from '../middleware/auth'
import { buildChat, generateChatTitle } from '../services/chat.service'
import { validateRequest } from '../middleware/validate'
import { sendMessageSchema } from '../validators/schemas'

const router = Router()

// List conversations for a PDF
router.get('/', authenticate, async (req, res) => {
  try {
    const pdfId = req.query.pdf_id as string

    if (!pdfId) {
      return res.status(400).json({ message: 'pdf_id is required' })
    }

    // Verify PDF belongs to user
    const pdfRepository = AppDataSource.getRepository(Pdf)
    const pdf = await pdfRepository.findOne({
      where: { id: pdfId, userId: req.user!.id },
    })

    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' })
    }

    const conversationRepository = AppDataSource.getRepository(Conversation)
    const conversations = await conversationRepository.find({
      where: { pdfId },
      relations: ['messages'],
      order: { createdAt: 'DESC' },
    })

    res.json(conversations.map((c) => c.toJSON()))
  } catch (error) {
    console.error('List conversations error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Create conversation
router.post('/', authenticate, async (req, res) => {
  try {
    const pdfId = req.query.pdf_id as string

    if (!pdfId) {
      return res.status(400).json({ message: 'pdf_id is required' })
    }

    // Verify PDF belongs to user
    const pdfRepository = AppDataSource.getRepository(Pdf)
    const pdf = await pdfRepository.findOne({
      where: { id: pdfId, userId: req.user!.id },
    })

    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' })
    }

    const conversationRepository = AppDataSource.getRepository(Conversation)
    const conversation = conversationRepository.create({
      pdfId,
      userId: req.user!.id,
      messages: [],
    })

    await conversationRepository.save(conversation)

    res.json(conversation.toJSON())
  } catch (error) {
    console.error('Create conversation error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Send message to conversation
router.post('/:id/messages', authenticate, validateRequest(sendMessageSchema), async (req, res) => {
  try {
    const conversationId = req.params.id
    const { input } = req.body
    const streaming = req.query.stream === 'true'

    const conversationRepository = AppDataSource.getRepository(Conversation)
    const conversation = await conversationRepository.findOne({
      where: { id: conversationId, userId: req.user!.id },
      relations: ['pdf', 'messages'],
    })

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' })
    }

    if (!conversation.pdfId) {
      return res.status(400).json({ message: 'Conversation has no associated PDF' })
    }

    const pdfId = conversation.pdfId

    // Verify PDF exists
    const pdfRepository = AppDataSource.getRepository(Pdf)
    const pdf = await pdfRepository.findOne({
      where: { id: pdfId, userId: req.user!.id },
    })

    if (!pdf) {
      console.error(`❌ PDF not found: ${pdfId}`)
      return res.status(404).json({ message: 'PDF not found' })
    }

    // Check if this is the first message (for title generation)
    const isFirstMessage = !conversation.messages || conversation.messages.length === 0

    // Save user message
    const messageRepository = AppDataSource.getRepository(Message)
    const userMessage = messageRepository.create({
      conversationId,
      role: 'user',
      content: input,
    })
    await messageRepository.save(userMessage)

    // Auto-generate title if this is the first message
    if (isFirstMessage && !conversation.title) {
      try {
        const title = await generateChatTitle(input, pdf.name)
        await conversationRepository.update(conversationId, { title })
      } catch (e) {
        console.error('Failed to generate title:', e)
      }
    }

    // Build chat
    try {
      const chat = await buildChat({
        conversationId,
        pdfId,
        streaming,
        metadata: {
          conversationId,
          userId: req.user!.id,
          pdfId,
        },
      })

      if (streaming) {
        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no')

        try {
          console.log('🌊 Starting streaming...')
          const stream = chat.stream(input)
          let fullResponse = ''

          for await (const chunk of stream) {
            if (typeof chunk === 'string') {
              // Regular content chunk
              fullResponse += chunk
              res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
              if (typeof (res as any).flush === 'function') {
                (res as any).flush()
              }
            } else if (chunk.type === 'suggestions') {
              // Suggestions event
              res.write(`data: ${JSON.stringify({ suggestions: chunk.data })}\n\n`)
              if (typeof (res as any).flush === 'function') {
                (res as any).flush()
              }
            }
          }
          console.log('✅ Streaming complete')

          // Save assistant message
          const assistantMessage = messageRepository.create({
            conversationId,
            role: 'assistant',
            content: fullResponse,
          })
          await messageRepository.save(assistantMessage)

          res.write(`data: [DONE]\n\n`)
          res.end()
        } catch (error) {
          console.error('Streaming error:', error)
          res.write(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`)
          res.end()
        }
      } else {
        // Non-streaming response
        console.log('💬 Generating response...')
        const response = await chat.run(input)
        console.log('✅ Response generated')

        // Save assistant message
        const assistantMessage = messageRepository.create({
          conversationId,
          role: 'assistant',
          content: response.content,
        })
        await messageRepository.save(assistantMessage)
        console.log('✅ Assistant message saved')

        res.json({
          role: 'assistant',
          content: response.content,
          suggestions: response.suggestions,
        })
      }
    } catch (buildError) {
      console.error('❌ Error building chat:', buildError)
      res.status(500).json({ message: 'Failed to build chat system' })
    }
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Rename conversation
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const conversationId = req.params.id
    const { title } = req.body

    const conversationRepository = AppDataSource.getRepository(Conversation)
    const conversation = await conversationRepository.findOne({
      where: { id: conversationId, userId: req.user!.id },
    })

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' })
    }

    await conversationRepository.update(conversationId, { title })

    res.json({ id: conversationId, title })
  } catch (error) {
    console.error('Rename conversation error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
