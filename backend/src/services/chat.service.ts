import { buildMemory, HistoryEntry } from './memory.service';
import { ChatAgent } from '../agents/chat/ChatAgent';
import { LlmTool } from '../agents/core/tools/LlmTool';
import {
  CHAT_TITLE_PROMPT,
} from '../prompts';

export interface ChatArgs {
  conversationId: string;
  pdfId: string;
  streaming: boolean;
  metadata: {
    conversationId: string;
    userId: string;
    pdfId: string;
  };
}

export interface ChatInterface {
  run(input: string): Promise<{ content: string; suggestions: string[] }>;
  stream(input: string): AsyncGenerator<string | { type: 'suggestions'; data: string[] }>;
}

export const generateChatTitle = async (message: string, pdfName?: string): Promise<string> => {
  const llm = new LlmTool();

  const messages = [
    CHAT_TITLE_PROMPT.build(),
    {
      role: 'user' as const,
      content: `PDF: ${pdfName || 'Document'}
User's first message: "${message}"

Generate title:`,
    },
  ];

  try {
    const response = await llm.execute({ messages });
    return response.content.trim().substring(0, 100);
  } catch (e) {
    console.error('Failed to generate title:', e);
    return message.substring(0, 50) + (message.length > 50 ? '...' : '');
  }
};

/**
 * Build Chat interface - now a thin facade over ChatAgent
 */
export const buildChat = async (args: ChatArgs): Promise<ChatInterface> => {
  const history = await buildMemory(args);
  const chatAgent = new ChatAgent();



  return {
    async run(input: string): Promise<{ content: string; suggestions: string[] }> {
      const result = await chatAgent.execute({
        task: 'answer_question',
        userQuery: input,
        pdfId: args.pdfId,
        conversationHistory: history.map((h: HistoryEntry) => ({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        })),
      });

      return {
        content: result.answer,
        suggestions: result.suggestions,
      };
    },

    async *stream(input: string): AsyncGenerator<string | { type: 'suggestions'; data: string[] }> {
      const streamGenerator = chatAgent.stream({
        userQuery: input,
        pdfId: args.pdfId,
        conversationHistory: history.map((h: HistoryEntry) => ({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        })),
      });

      for await (const chunk of streamGenerator) {
        switch (chunk.type) {
          case 'token':
            if (chunk.content) {
              yield chunk.content;
            }
            break;
          case 'suggestions':
            if (chunk.suggestions && chunk.suggestions.length > 0) {
              yield { type: 'suggestions', data: chunk.suggestions };
            }
            break;
          case 'error':
            console.error('[ChatService] Stream error:', chunk.error);
            yield `Error: ${chunk.error}`;
            break;
          case 'done':
            break;
        }
      }
    },
  };
};
