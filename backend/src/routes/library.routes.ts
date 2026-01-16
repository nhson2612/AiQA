import { Router } from 'express'
import { AppDataSource } from '../config/database'
import { Conversation, Message } from '../entities'
import { authenticate } from '../middleware/auth'
import { ChatAgent, StreamChunk } from '../agents/chat/ChatAgent'
import { validateRequest } from '../middleware/validate'
import { libraryMessageSchema } from '../validators/schemas'
import { createContextLogger } from '../services/logger.service'

const router = Router()

// Create a library conversation (no PDF attached)
router.post('/conversations', authenticate, async (req, res) => {
    try {
        const conversationRepository = AppDataSource.getRepository(Conversation)
        const conversation = conversationRepository.create({
            pdfId: null as unknown as string, // Library chat has no single PDF
            userId: req.user!.id,
            title: 'Library Chat',
            messages: [],
        })

        await conversationRepository.save(conversation)
        res.json(conversation.toJSON())
    } catch (error) {
        const contextLogger = createContextLogger(req)
        contextLogger.error('Create library conversation error', { error: (error as Error).message })
        res.status(500).json({ message: 'Internal server error' })
    }
})

// List library conversations
router.get('/conversations', authenticate, async (req, res) => {
    try {
        const conversationRepository = AppDataSource.getRepository(Conversation)
        // Library conversations have null pdfId
        const conversations = await conversationRepository
            .createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.messages', 'messages')
            .where('conversation.userId = :userId', { userId: req.user!.id })
            .andWhere('conversation.pdfId IS NULL')
            .orderBy('conversation.createdAt', 'DESC')
            .getMany()

        res.json(conversations.map((c) => c.toJSON()))
    } catch (error) {
        const contextLogger = createContextLogger(req)
        contextLogger.error('List library conversations error', { error: (error as Error).message })
        res.status(500).json({ message: 'Internal server error' })
    }
})

// Send message to library chat
router.post('/messages', authenticate, validateRequest(libraryMessageSchema), async (req, res) => {
    const contextLogger = createContextLogger(req)
    try {
        const { input, conversationId } = req.body
        const streaming = req.query.stream === 'true'

        let conversation: Conversation | null = null
        const conversationRepository = AppDataSource.getRepository(Conversation)
        const messageRepository = AppDataSource.getRepository(Message)

        // If conversationId provided, load existing conversation
        if (conversationId) {
            conversation = await conversationRepository.findOne({
                where: { id: conversationId, userId: req.user!.id },
                relations: ['messages'],
            })
            if (!conversation) {
                contextLogger.warn('Conversation not found', { conversationId })
                return res.status(404).json({ message: 'Conversation not found' })
            }
        } else {
            // Create new library conversation
            conversation = conversationRepository.create({
                pdfId: null as unknown as string,
                userId: req.user!.id,
                title: 'Library Chat',
                messages: [],
            })
            await conversationRepository.save(conversation)
            contextLogger.info('New library conversation created', { conversationId: conversation.id })
        }

        // Save user message
        const userMessage = messageRepository.create({
            conversationId: conversation.id,
            role: 'user',
            content: input,
        })
        await messageRepository.save(userMessage)

        // Initialize Chat Agent
        const chatAgent = new ChatAgent()
        const history = conversation.messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
        }))

        if (streaming) {
            res.setHeader('Content-Type', 'text/event-stream')
            res.setHeader('Cache-Control', 'no-cache')
            res.setHeader('Connection', 'keep-alive')
            res.setHeader('X-Accel-Buffering', 'no')

            try {
                contextLogger.info('Starting library streaming response')
                // Use ChatAgent streaming
                const stream = chatAgent.stream({
                    userQuery: input,
                    userId: req.user!.id,
                    conversationHistory: history,
                })

                let fullResponse = ''

                for await (const chunk of stream) {
                    if (chunk.type === 'token' && chunk.content) {
                        fullResponse += chunk.content
                        res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`)
                        if (typeof (res as any).flush === 'function') {
                            (res as any).flush()
                        }
                    } else if (chunk.type === 'suggestions' && chunk.suggestions) {
                        res.write(`data: ${JSON.stringify({ suggestions: chunk.suggestions })}\n\n`)
                    } else if (chunk.type === 'error') {
                        contextLogger.error('Stream chunk error', { error: chunk.error })
                    }
                }

                // Save assistant message after stream completes
                const assistantMessage = messageRepository.create({
                    conversationId: conversation.id,
                    role: 'assistant',
                    content: fullResponse,
                })
                await messageRepository.save(assistantMessage)
                contextLogger.info('Library streaming response completed')

                res.write(`data: ${JSON.stringify({ conversationId: conversation.id })}\n\n`)
                res.write(`data: [DONE]\n\n`)
                res.end()

            } catch (error) {
                contextLogger.error('Library chat streaming error', { error: (error as Error).message })
                res.write(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`)
                res.end()
            }
        } else {
            // Non-streaming execution
            contextLogger.info('Starting library non-streaming response')
            const result = await chatAgent.execute({
                task: 'answer_library',
                userQuery: input,
                userId: req.user!.id,
                conversationHistory: history,
            })

            const assistantMessage = messageRepository.create({
                conversationId: conversation.id,
                role: 'assistant',
                content: result.answer,
            })
            await messageRepository.save(assistantMessage)
            contextLogger.info('Library non-streaming response completed')

            res.json({
                conversationId: conversation.id,
                role: 'assistant',
                content: result.answer,
                suggestions: result.suggestions,
            })
        }
    } catch (error) {
        contextLogger.error('Library chat error', { error: (error as Error).message })
        res.status(500).json({ message: 'Internal server error' })
    }
})

export default router
