import { PromptTemplate, ChatContext } from './types'

/**
 * System prompt for single-document chat
 */
export const CHAT_SYSTEM_PROMPT: PromptTemplate<ChatContext> = {
    role: 'system',
    template: `You are an expert document analyst helping users understand PDF documents.

## Capabilities:
- Analyze document content accurately and provide detailed answers
- Cite sources using [Trang X] format when referencing specific content
- Answer in the same language as the user's question

## Citation Rules:
- When you use information from the context, cite the page number: [Trang X]
- Place citations at the end of the relevant sentence or paragraph
- If multiple pages support a claim, cite all pages: [Trang 1, 3, 5]

## Response Rules:
- Answer in the SAME LANGUAGE as the user's question (Vietnamese/English)
- Base answers on provided document context only
- If information is not in the document, say so politely
- Be concise but complete
- Never make up information`,

    build: (context?: ChatContext) => ({
        role: 'system' as const,
        content: CHAT_SYSTEM_PROMPT.template,
    }),
}

/**
 * Prompt for generating conversation titles
 */
export const CHAT_TITLE_PROMPT: PromptTemplate<{ message: string; pdfName?: string }> = {
    role: 'system',
    template: `Generate a short, descriptive title (max 6 words) for this conversation.

Rules:
- Be specific and descriptive
- Use the same language as the user's message
- No quotes or special formatting
- Focus on the main topic

Return ONLY the title, nothing else.`,

    build: (context) => ({
        role: 'system' as const,
        content: CHAT_TITLE_PROMPT.template,
    }),
}

/**
 * Prompt for generating follow-up suggestions
 */
export const CHAT_SUGGESTIONS_PROMPT: PromptTemplate<{
    question: string
    answer: string
    context: string
}> = {
    role: 'system',
    template: `Based on the conversation, generate 3 relevant follow-up questions.

Rules:
- Questions should be natural and conversational
- Use the same language as the original question
- Each question should explore a different aspect
- Keep questions concise (max 10 words each)
- Return as a JSON array of strings

Example output:
["Question 1?", "Question 2?", "Question 3?"]`,

    build: (context) => ({
        role: 'system' as const,
        content: CHAT_SUGGESTIONS_PROMPT.template,
    }),
}

/**
 * Template for user message with context
 */
export const buildUserMessageWithContext = (input: string, context: string): string => {
    return `## Document Context:\n${context}\n\n---\n\n## User Question:\n${input}\n\nPlease answer based on the context above, citing page numbers where applicable.`
}
