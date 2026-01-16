import { IStreamingStep, IStreamChunk, IStepResult } from '../../core/types';
import { IChatContext } from '../types';
import { LlmTool } from '../../core/tools/LlmTool';
import { CHAT_SYSTEM_PROMPT, LIBRARY_SYSTEM_PROMPT, buildUserMessageWithContext, buildLibraryUserMessage } from '../../../prompts';
import logger from '../../../services/logger.service';

/**
 * Streaming step for generating AI answers
 * Works for both single-document and library-wide chat
 */
export class GenerateAnswerStreamStep implements IStreamingStep<IChatContext> {
    name = 'GenerateAnswerStreamStep';
    description = 'Streams AI answer generation token by token';

    async *stream(context: IChatContext): AsyncGenerator<IStreamChunk> {
        logger.debug('[GenerateAnswerStreamStep] Starting stream');

        // Determine if this is library chat or single-document chat
        const isLibraryChat = !!context.userId && !context.pdfId;

        // Select appropriate prompts
        const systemPrompt = isLibraryChat ? LIBRARY_SYSTEM_PROMPT.build() : CHAT_SYSTEM_PROMPT.build();
        const userMessageContent = isLibraryChat
            ? buildLibraryUserMessage(context.userQuery, context.contextString || '')
            : buildUserMessageWithContext(context.userQuery, context.contextString || '');

        const llmTool = new LlmTool();

        const messages = [
            systemPrompt,
            ...context.conversationHistory.slice(-6).map((h) => ({
                role: h.role as 'user' | 'assistant',
                content: h.content,
            })),
            {
                role: 'user' as const,
                content: userMessageContent,
            },
        ];

        let fullResponse = '';

        try {
            const stream = llmTool.streamRun({ messages });

            for await (const chunk of stream) {
                fullResponse += chunk.content;
                yield { type: 'token', content: chunk.content };
            }

            // Store the complete answer in context for post-processing steps
            yield { type: 'data', data: { answer: fullResponse } };

            logger.debug('[GenerateAnswerStreamStep] Stream completed', {
                answerLength: fullResponse.length
            });

        } catch (error) {
            logger.error('[GenerateAnswerStreamStep] Stream failed', {
                error: (error as Error).message
            });
            yield { type: 'error', error: (error as Error).message };
        }
    }

    /**
     * Non-streaming execute - not used for streaming workflows
     * Required by IStep interface
     */
    async execute(context: IChatContext): Promise<IStepResult> {
        throw new Error('GenerateAnswerStreamStep does not support non-streaming execution. Use stream() instead.');
    }
}
