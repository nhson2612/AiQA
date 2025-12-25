import { Router } from 'express'
import { AppDataSource } from '../config/database'
import { Conversation, Message } from '../entities'
import { authenticate } from '../middleware/auth'
import { buildGlobalRetriever, GlobalRetrieverResult } from '../services/globalRetriever.service'
import { buildLLM } from '../services/llm.service'
import { generateSuggestions } from '../services/chat.service'
import { LIBRARY_SYSTEM_PROMPT, buildLibraryUserMessage } from '../prompts'

const router = Router()

// Configuration
const RAG_TOP_K = parseInt(process.env.RAG_TOP_K || '5', 10)

/**
 * Build context string with PDF source citations
 */
const buildContextWithCitations = (docs: GlobalRetrieverResult[]): string => {
    return docs
        .map((d) => {
            const pageNum = d.metadata?.pageNumber as number | undefined
            const pageRef = pageNum ? `[${d.pdfName} - Trang ${pageNum}]` : `[${d.pdfName}]`
            return `${pageRef}\n${d.pageContent}`
        })
        .join('\n\n---\n\n')
}

// Prompts are now imported from centralized prompts module

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
        console.error('Create library conversation error:', error)
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
        console.error('List library conversations error:', error)
        res.status(500).json({ message: 'Internal server error' })
    }
})

// Send message to library chat
router.post('/messages', authenticate, async (req, res) => {
    try {
        const { input, conversationId } = req.body
        const streaming = req.query.stream === 'true'

        if (!input) {
            return res.status(400).json({ message: 'input is required' })
        }

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
        }

        // Save user message
        const userMessage = messageRepository.create({
            conversationId: conversation.id,
            role: 'user',
            content: input,
        })
        await messageRepository.save(userMessage)

        // Build global retriever
        console.log('🌐 Building global retriever...')
        const retriever = await buildGlobalRetriever(req.user!.id)

        // Search across all documents
        console.log('🔍 Searching across library...')
        const docs = await retriever(input)

        if (docs.length === 0) {
            const noDocsResponse = 'Tôi không tìm thấy thông tin liên quan trong thư viện tài liệu của bạn. Vui lòng thử hỏi theo cách khác.'

            const assistantMessage = messageRepository.create({
                conversationId: conversation.id,
                role: 'assistant',
                content: noDocsResponse,
            })
            await messageRepository.save(assistantMessage)

            if (streaming) {
                res.setHeader('Content-Type', 'text/event-stream')
                res.setHeader('Cache-Control', 'no-cache')
                res.setHeader('Connection', 'keep-alive')
                res.write(`data: ${JSON.stringify({ content: noDocsResponse })}\n\n`)
                res.write(`data: [DONE]\n\n`)
                res.end()
            } else {
                res.json({
                    conversationId: conversation.id,
                    role: 'assistant',
                    content: noDocsResponse,
                    suggestions: [],
                })
            }
            return
        }

        const context = buildContextWithCitations(docs)
        console.log(`📄 Context from ${docs.length} chunks across library`)

        // Build LLM
        const llm = buildLLM({
            conversationId: conversation.id,
            pdfId: '',
            streaming,
            metadata: { conversationId: conversation.id, userId: req.user!.id, pdfId: '' },
        })

        const messages = [
            LIBRARY_SYSTEM_PROMPT.build(),
            ...(conversation.messages || []).slice(-6).map((m) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
            })),
            { role: 'user' as const, content: buildLibraryUserMessage(input, context) },
        ]

        if (streaming) {
            res.setHeader('Content-Type', 'text/event-stream')
            res.setHeader('Cache-Control', 'no-cache')
            res.setHeader('Connection', 'keep-alive')
            res.setHeader('X-Accel-Buffering', 'no')

            try {
                const stream = llm.stream(messages)
                let fullResponse = ''

                for await (const chunk of stream) {
                    fullResponse += chunk.content
                    res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`)
                    if (typeof (res as unknown as { flush?: () => void }).flush === 'function') {
                        (res as unknown as { flush: () => void }).flush()
                    }
                }

                // Save assistant message
                const assistantMessage = messageRepository.create({
                    conversationId: conversation.id,
                    role: 'assistant',
                    content: fullResponse,
                })
                await messageRepository.save(assistantMessage)

                // Generate suggestions
                const suggestions = await generateSuggestions(input, fullResponse, context)
                if (suggestions.length > 0) {
                    res.write(`data: ${JSON.stringify({ suggestions })}\n\n`)
                }

                res.write(`data: ${JSON.stringify({ conversationId: conversation.id })}\n\n`)
                res.write(`data: [DONE]\n\n`)
                res.end()
            } catch (error) {
                console.error('Library chat streaming error:', error)
                res.write(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`)
                res.end()
            }
        } else {
            const response = await llm.invoke(messages)

            const assistantMessage = messageRepository.create({
                conversationId: conversation.id,
                role: 'assistant',
                content: response.content,
            })
            await messageRepository.save(assistantMessage)

            const suggestions = await generateSuggestions(input, response.content, context)

            res.json({
                conversationId: conversation.id,
                role: 'assistant',
                content: response.content,
                suggestions,
            })
        }
    } catch (error) {
        console.error('Library chat error:', error)
        res.status(500).json({ message: 'Internal server error' })
    }
})

export default router
