import { IAgent } from '../core/types';
import { IChatContext } from './types';
import logger from '../../services/logger.service';
import { DatabaseError, ExternalAPIError } from '../../services/logger.service';
import { AnswerQuestionWorkflow } from './workflows/AnswerQuestionWorkflow';
import { AnswerLibraryWorkflow } from './workflows/AnswerLibraryWorkflow';
import { AnswerQuestionStreamWorkflow } from './workflows/AnswerQuestionStreamWorkflow';
import { AnswerLibraryStreamWorkflow } from './workflows/AnswerLibraryStreamWorkflow';

export interface ChatAgentInput {
    task: 'answer_question' | 'answer_library';
    userQuery: string;
    pdfId?: string; // Optional for library search
    userId?: string; // Required for library search
    conversationHistory: { role: 'user' | 'assistant'; content: string }[];
}

export interface ChatAgentStreamInput {
    userQuery: string;
    pdfId?: string; // Optional for library stream
    userId?: string; // Required for library stream
    conversationHistory: { role: 'user' | 'assistant'; content: string }[];
}

export interface ChatAgentOutput {
    answer: string;
    suggestions: string[];
}

export interface StreamChunk {
    type: 'token' | 'suggestions' | 'error' | 'done';
    content?: string;
    suggestions?: string[];
    error?: string;
}

export class ChatAgent implements IAgent {
    name = 'ChatAgent';
    description = 'Agent for handling chat/Q&A interactions with documents.';

    async execute(input: ChatAgentInput): Promise<ChatAgentOutput> {
        logger.debug('[ChatAgent] Execute called', { task: input.task });

        try {
            switch (input.task) {
                case 'answer_question':
                    return await this.answerQuestion(input);
                case 'answer_library':
                    return await this.answerLibrary(input);
                default:
                    logger.error('[ChatAgent] Unknown task requested', { task: (input as any).task });
                    throw new Error(`Unknown task: ${(input as any).task}`);
            }
        } catch (error) {
            logger.error('[ChatAgent] Execution failed', {
                task: input.task,
                error: (error as Error).message,
                stack: (error as Error).stack
            });
            throw error;
        }
    }

    /**
     * Streaming execution - yields tokens as they arrive from LLM
     * Now uses StreamingWorkflow pattern for clean, extensible architecture
     */
    async *stream(input: ChatAgentStreamInput): AsyncGenerator<StreamChunk> {
        const isLibraryChat = !input.pdfId;
        const taskName = isLibraryChat ? 'answer_library' : 'answer_question';

        logger.info(`[ChatAgent] Stream started: ${taskName}`, {
            pdfId: input.pdfId,
            queryLength: input.userQuery.length,
        });

        // Select appropriate workflow
        const workflow = isLibraryChat
            ? new AnswerLibraryStreamWorkflow()
            : new AnswerQuestionStreamWorkflow();

        const initialContext: IChatContext = {
            userQuery: input.userQuery,
            pdfId: input.pdfId,
            userId: input.userId,
            conversationHistory: input.conversationHistory,
        };

        try {
            // Delegate to workflow - it handles all the steps
            for await (const chunk of workflow.execute(initialContext)) {
                // Map generic IStreamChunk to ChatAgent's StreamChunk format
                if (chunk.type === 'token' && chunk.content) {
                    yield { type: 'token', content: chunk.content };
                } else if (chunk.type === 'data' && chunk.data?.suggestions) {
                    yield { type: 'suggestions', suggestions: chunk.data.suggestions };
                } else if (chunk.type === 'error') {
                    yield { type: 'error', error: chunk.error };
                } else if (chunk.type === 'done') {
                    yield { type: 'done' };
                }
            }

            logger.info(`[ChatAgent] Stream completed: ${taskName}`);

        } catch (error) {
            logger.error('[ChatAgent] Stream failed', {
                task: taskName,
                error: (error as Error).message,
                stack: (error as Error).stack
            });
            yield { type: 'error', error: (error as Error).message };
        }
    }

    private async answerQuestion(input: ChatAgentInput): Promise<ChatAgentOutput> {
        logger.info('[ChatAgent] Answering question', {
            pdfId: input.pdfId,
            queryLength: input.userQuery.length,
            historyLength: input.conversationHistory.length
        });

        try {
            const workflow = new AnswerQuestionWorkflow();
            const initialContext: IChatContext = {
                userQuery: input.userQuery,
                pdfId: input.pdfId,
                conversationHistory: input.conversationHistory,
            };

            logger.debug('[ChatAgent] Starting AnswerQuestionWorkflow');
            const resultContext = await workflow.execute(initialContext);

            logger.info('[ChatAgent] Question answered successfully', {
                answerLength: resultContext.answer?.length || 0,
                suggestionCount: resultContext.suggestions?.length || 0
            });

            return {
                answer: resultContext.answer || '',
                suggestions: resultContext.suggestions || [],
            };
        } catch (error) {
            logger.error('[ChatAgent] Failed to answer question', {
                pdfId: input.pdfId,
                error: (error as Error).message,
                stack: (error as Error).stack
            });

            if (error instanceof DatabaseError || error instanceof ExternalAPIError) {
                throw error;
            }

            throw new ExternalAPIError('ChatAgent', 500, {
                message: 'Failed to answer question',
                originalError: (error as Error).message
            });
        }
    }

    private async answerLibrary(input: ChatAgentInput): Promise<ChatAgentOutput> {
        logger.info('[ChatAgent] Answering library question', {
            userId: input.userId,
            queryLength: input.userQuery.length,
        });

        if (!input.userId) {
            throw new Error('userId is required for library search');
        }

        try {
            const workflow = new AnswerLibraryWorkflow();

            const initialContext: IChatContext = {
                userQuery: input.userQuery,
                userId: input.userId,
                conversationHistory: input.conversationHistory,
            };

            // Execute workflow - it handles all steps
            const finalContext = await workflow.execute(initialContext);

            logger.info('[ChatAgent] Library question answered successfully', {
                answerLength: finalContext.answer?.length || 0,
                suggestionCount: finalContext.suggestions?.length || 0
            });

            return {
                answer: finalContext.answer || '',
                suggestions: finalContext.suggestions || [],
            };
        } catch (error) {
            logger.error('[ChatAgent] Failed to answer library question', {
                userId: input.userId,
                error: (error as Error).message,
                stack: (error as Error).stack
            });

            if (error instanceof DatabaseError || error instanceof ExternalAPIError) {
                throw error;
            }

            throw new ExternalAPIError('ChatAgent', 500, {
                message: 'Failed to answer library question',
                originalError: (error as Error).message
            });
        }
    }
}

