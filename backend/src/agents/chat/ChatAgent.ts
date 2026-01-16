import { IAgent } from '../core/types';
import { IChatContext } from './types';
import logger from '../../services/logger.service';
import { DatabaseError, ExternalAPIError } from '../../services/logger.service';
import { AnswerQuestionWorkflow } from './workflows/AnswerQuestionWorkflow';
import { AnswerLibraryWorkflow } from './workflows/AnswerLibraryWorkflow';
import { AnswerQuestionStreamWorkflow } from './workflows/AnswerQuestionStreamWorkflow';
import { AnswerLibraryStreamWorkflow } from './workflows/AnswerLibraryStreamWorkflow';
import { AnswerSynthesisWorkflow } from './workflows/AnswerSynthesisWorkflow';
import { AnswerSynthesisStreamWorkflow } from './workflows/AnswerSynthesisStreamWorkflow';

export interface ChatAgentInput {
    task: 'answer_question' | 'answer_library' | 'answer_synthesis';
    userQuery: string;
    pdfId?: string; // Optional for library search
    userId?: string; // Required for library/synthesis search
    selectedPdfIds?: string[]; // Required for synthesis - specific PDFs to analyze
    conversationHistory: { role: 'user' | 'assistant'; content: string }[];
}

export interface ChatAgentStreamInput {
    userQuery: string;
    pdfId?: string; // Optional for library stream
    userId?: string; // Required for library/synthesis stream
    selectedPdfIds?: string[]; // For synthesis stream - specific PDFs to analyze
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
                case 'answer_synthesis':
                    return await this.answerSynthesis(input);
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
        // Determine task type: synthesis > library > question
        const isSynthesis = input.selectedPdfIds && input.selectedPdfIds.length > 0;
        const isLibraryChat = !input.pdfId && !isSynthesis;
        const taskName = isSynthesis ? 'answer_synthesis' : (isLibraryChat ? 'answer_library' : 'answer_question');

        logger.info(`[ChatAgent] Stream started: ${taskName}`, {
            pdfId: input.pdfId,
            selectedPdfCount: input.selectedPdfIds?.length,
            queryLength: input.userQuery.length,
        });

        // Select appropriate workflow based on task type
        let workflow;
        if (isSynthesis) {
            workflow = new AnswerSynthesisStreamWorkflow();
        } else if (isLibraryChat) {
            workflow = new AnswerLibraryStreamWorkflow();
        } else {
            workflow = new AnswerQuestionStreamWorkflow();
        }

        const initialContext: IChatContext = {
            userQuery: input.userQuery,
            pdfId: input.pdfId,
            userId: input.userId,
            selectedPdfIds: input.selectedPdfIds,
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

    private async answerSynthesis(input: ChatAgentInput): Promise<ChatAgentOutput> {
        logger.info('[ChatAgent] Starting synthesis across selected documents', {
            userId: input.userId,
            selectedPdfCount: input.selectedPdfIds?.length,
            queryLength: input.userQuery.length,
        });

        if (!input.userId) {
            throw new Error('userId is required for synthesis');
        }

        if (!input.selectedPdfIds || input.selectedPdfIds.length === 0) {
            throw new Error('selectedPdfIds is required for synthesis');
        }

        try {
            const workflow = new AnswerSynthesisWorkflow();

            const initialContext: IChatContext = {
                userQuery: input.userQuery,
                userId: input.userId,
                selectedPdfIds: input.selectedPdfIds,
                conversationHistory: input.conversationHistory,
            };

            const finalContext = await workflow.execute(initialContext);

            logger.info('[ChatAgent] Synthesis completed successfully', {
                answerLength: finalContext.answer?.length || 0,
                suggestionCount: finalContext.suggestions?.length || 0
            });

            return {
                answer: finalContext.answer || '',
                suggestions: finalContext.suggestions || [],
            };
        } catch (error) {
            logger.error('[ChatAgent] Failed to synthesize documents', {
                userId: input.userId,
                selectedPdfIds: input.selectedPdfIds,
                error: (error as Error).message,
                stack: (error as Error).stack
            });

            if (error instanceof DatabaseError || error instanceof ExternalAPIError) {
                throw error;
            }

            throw new ExternalAPIError('ChatAgent', 500, {
                message: 'Failed to synthesize documents',
                originalError: (error as Error).message
            });
        }
    }
}
