import Groq from 'groq-sdk'
import { ChatArgs } from './chat.service'

export interface LLMLike {
  streaming: boolean
  invoke(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  ): Promise<{ content: string }>
  stream(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  ): AsyncGenerator<{ content: string }>
}

export const buildLLM = (args: ChatArgs): LLMLike => {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set')
  }

  const groq = new Groq({ apiKey })
  const model = process.env.GROQ_MODEL || 'llama3-8b-8192'

  return {
    streaming: args.streaming,

    async invoke(messages) {
      const chatCompletion = await groq.chat.completions.create({
        messages: messages.map((m) => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        })),
        model: model,
      })

      const content = chatCompletion.choices[0]?.message?.content || ''
      return { content }
    },

    async *stream(messages) {
      const stream = await groq.chat.completions.create({
        messages: messages.map((m) => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        })),
        model: model,
        stream: true,
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          yield { content }
        }
      }
    },
  }
}
