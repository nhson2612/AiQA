import { buildRetriever, Retriever } from './retriever.service'
import { buildMemory, HistoryEntry } from './memory.service'
import { buildLLM, LLMLike } from './llm.service'
import {
  CHAT_SYSTEM_PROMPT,
  CHAT_TITLE_PROMPT,
  CHAT_SUGGESTIONS_PROMPT,
  buildUserMessageWithContext,
} from '../prompts'

export interface ChatArgs {
  conversationId: string
  pdfId: string
  streaming: boolean
  metadata: {
    conversationId: string
    userId: string
    pdfId: string
  }
}

export interface ChatInterface {
  run(input: string): Promise<{ content: string; suggestions: string[] }>
  stream(input: string): AsyncGenerator<string | { type: 'suggestions'; data: string[] }>
}

// Configuration from environment
const RAG_TOP_K = parseInt(process.env.RAG_TOP_K || '5', 10)
const RAG_MULTI_QUERY = process.env.RAG_MULTI_QUERY === 'true'

/**
 * Generate a short title for a conversation based on the first message
 */
export const generateChatTitle = async (message: string, pdfName?: string): Promise<string> => {
  const llm = buildLLM({ conversationId: '', pdfId: '', streaming: false, metadata: {} as any })

  const messages = [
    CHAT_TITLE_PROMPT.build(),
    {
      role: 'user' as const,
      content: `PDF: ${pdfName || 'Document'}
User's first message: "${message}"

Generate title:`,
    },
  ]

  try {
    const response = await llm.invoke(messages)
    return response.content.trim().substring(0, 100) // Limit title length
  } catch (e) {
    console.error('Failed to generate title:', e)
    return message.substring(0, 50) + (message.length > 50 ? '...' : '')
  }
}

/**
 * Generate suggested follow-up questions based on context and conversation
 */
export const generateSuggestions = async (
  question: string,
  answer: string,
  context: string
): Promise<string[]> => {
  const llm = buildLLM({ conversationId: '', pdfId: '', streaming: false, metadata: {} as any })

  const messages = [
    CHAT_SUGGESTIONS_PROMPT.build(),
    {
      role: 'user' as const,
      content: `User asked: "${question}"
AI answered: "${answer.substring(0, 500)}"

Available context: "${context.substring(0, 1000)}"

Generate 3 follow-up questions:`,
    },
  ]

  try {
    const response = await llm.invoke(messages)
    const content = response.content.trim()
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0])
      return suggestions.slice(0, 3)
    }
    return []
  } catch (e) {
    console.error('Failed to generate suggestions:', e)
    return []
  }
}

export const buildChat = async (args: ChatArgs): Promise<ChatInterface> => {
  console.log('🔧 Building retriever...')
  const retriever = await buildRetriever(args)
  console.log('🔧 Building memory...')
  const history = await buildMemory(args)
  console.log('🔧 Building LLM...')
  const llm: LLMLike = buildLLM(args)
  console.log('✅ All components built')
  console.log(`📊 RAG Config: TOP_K=${RAG_TOP_K}, MULTI_QUERY=${RAG_MULTI_QUERY}`)

  /**
   * Generate multiple search queries based on user input and conversation context
   */
  const generateSearchQueries = async (input: string, recentHistory: HistoryEntry[]): Promise<string[]> => {
    console.log('🔍 Generating search queries...')
    const queryGeneratorLLM = buildLLM({ ...args, streaming: false })

    const historyContext = recentHistory
      .slice(-4)
      .map((h) => `${h.role}: ${h.content}`)
      .join('\n')

    const messages = [
      {
        role: 'system' as const,
        content: `You are a search query generator for a document Q&A system.

Your task: Generate ${RAG_MULTI_QUERY ? '2-3 diverse' : '1 focused'} search queries to find relevant information.

RULES:
1. Understand the user's TRUE intent from conversation context
2. Resolve references like "that", "it", "this" from previous messages
3. Generate queries in ENGLISH
4. Focus on SEMANTIC meaning

OUTPUT FORMAT: Return ONLY a JSON array of strings.
Example: ["query about main topic", "related concept query"]`,
      },
      {
        role: 'user' as const,
        content: `Recent conversation:\n${historyContext || '(No previous messages)'}\n\nCurrent question: "${input}"\n\nGenerate search queries:`,
      },
    ]

    try {
      const response = await queryGeneratorLLM.invoke(messages)
      const content = response.content.trim()
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const queries = JSON.parse(jsonMatch[0])
        console.log(`✅ Generated ${queries.length} queries:`)
        queries.forEach((q: string, i: number) => console.log(`   ${i + 1}. "${q}"`))
        return queries.length > 0 ? queries : [input]
      }
      return [input]
    } catch (e) {
      console.error('Query generation failed:', e)
      return [input]
    }
  }

  /**
   * Retrieve documents with deduplication
   */
  const retrieveWithMultiQuery = async (queries: string[]): Promise<{ pageContent: string; metadata?: Record<string, any> }[]> => {
    console.log('📚 Retrieving documents...')
    const allResults: { pageContent: string; metadata?: Record<string, any> }[] = []
    const seenContent = new Set<string>()

    for (const query of queries) {
      const results = await retriever(query)
      for (const doc of results) {
        const contentKey = doc.pageContent.substring(0, 100).toLowerCase()
        if (!seenContent.has(contentKey)) {
          seenContent.add(contentKey)
          allResults.push(doc)
        }
      }
    }

    const topResults = allResults.slice(0, RAG_TOP_K)
    console.log(`✅ Retrieved ${topResults.length} unique documents`)
    return topResults
  }

  /**
   * Build context string with page citations
   */
  const buildContextWithCitations = (docs: { pageContent: string; metadata?: Record<string, any> }[]): string => {
    return docs.map((d) => {
      const pageNum = d.metadata?.pageNumber
      const pageRef = pageNum ? `[Trang ${pageNum}]` : ''
      return `${pageRef}\n${d.pageContent}`
    }).join('\n\n---\n\n')
  }

  // Prompts are now imported from centralized prompts module

  return {
    async run(input: string): Promise<{ content: string; suggestions: string[] }> {
      const queries = await generateSearchQueries(input, history)
      const docs = await retrieveWithMultiQuery(queries)

      if (docs.length === 0) {
        console.warn('⚠️  No documents found!')
        return {
          content: 'Tôi không tìm thấy thông tin liên quan trong tài liệu. Vui lòng thử hỏi theo cách khác.',
          suggestions: [],
        }
      }

      const context = buildContextWithCitations(docs)
      console.log(`📄 Context length: ${context.length} characters`)

      const messages = [
        CHAT_SYSTEM_PROMPT.build(),
        ...history.slice(-6).map((h) => ({ role: h.role, content: h.content })),
        { role: 'user' as const, content: buildUserMessageWithContext(input, context) },
      ]

      console.log('🤖 Calling LLM...')
      const response = await llm.invoke(messages)
      const content = response.content
      console.log('✅ LLM responded')

      // Generate suggestions (don't await to avoid blocking)
      console.log('💡 Generating suggestions...')
      const suggestions = await generateSuggestions(input, content, context)
      console.log(`✅ Generated ${suggestions.length} suggestions`)

      return { content, suggestions }
    },

    async *stream(input: string): AsyncGenerator<string | { type: 'suggestions'; data: string[] }> {
      const queries = await generateSearchQueries(input, history)
      const docs = await retrieveWithMultiQuery(queries)

      if (docs.length === 0) {
        console.warn('⚠️  No documents found!')
        yield 'Tôi không tìm thấy thông tin liên quan trong tài liệu.'
        return
      }

      const context = buildContextWithCitations(docs)
      console.log(`📄 Context length: ${context.length} characters`)

      const messages = [
        CHAT_SYSTEM_PROMPT.build(),
        ...history.slice(-6).map((h) => ({ role: h.role, content: h.content })),
        { role: 'user' as const, content: buildUserMessageWithContext(input, context) },
      ]

      console.log('🤖 Calling LLM streaming...')
      const stream = llm.stream(messages)
      let fullResponse = ''

      for await (const chunk of stream) {
        fullResponse += chunk.content
        yield chunk.content
      }
      console.log('✅ Streaming complete')

      // Generate and yield suggestions at the end
      console.log('💡 Generating suggestions...')
      const suggestions = await generateSuggestions(input, fullResponse, context)
      if (suggestions.length > 0) {
        yield { type: 'suggestions', data: suggestions }
      }
    },
  }
}
