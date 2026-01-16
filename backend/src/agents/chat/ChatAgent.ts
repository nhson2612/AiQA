import { IAgent } from '../core/types';
import { AnswerQuestionWorkflow } from './workflows/AnswerQuestionWorkflow';
import { IChatContext } from './types';
import logger from '../../services/logger.service';
import { DatabaseError, ExternalAPIError } from '../../services/logger.service';
import { LlmTool } from '../core/tools/LlmTool';
import { RetrieverTool } from '../core/tools/RetrieverTool';
import { GenerateSearchQueriesStep } from './steps/GenerateSearchQueriesStep';
import { RetrieveContextStep } from './steps/RetrieveContextStep';
import { GlobalRetrieveContextStep } from './steps/GlobalRetrieveContextStep';
import { GenerateAnswerStep } from './steps/GenerateAnswerStep';
import { GenerateSuggestionsStep } from './steps/GenerateSuggestionsStep';
import { CHAT_SYSTEM_PROMPT, buildUserMessageWithContext, CHAT_SUGGESTIONS_PROMPT, LIBRARY_SYSTEM_PROMPT, buildLibraryUserMessage } from '../../prompts';

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
     * Uses the same retrieval workflow but streams the final answer
     */
    async *stream(input: ChatAgentStreamInput): AsyncGenerator<StreamChunk> {
        logger.info('[ChatAgent] Stream started', {
            pdfId: input.pdfId,
            queryLength: input.userQuery.length,
            historyLength: input.conversationHistory.length
        });

        try {
            // Step 1: Generate search queries (reuse existing step logic)
            const generateQueriesStep = new GenerateSearchQueriesStep();
            const retrieveContextStep = new RetrieveContextStep();

            let context: IChatContext = {
                userQuery: input.userQuery,
                pdfId: input.pdfId,
                conversationHistory: input.conversationHistory,
            };

            // Execute query generation
            logger.debug('[ChatAgent.stream] Generating search queries');
            const queriesResult = await generateQueriesStep.execute(context);
            if (!queriesResult.success) {
                yield { type: 'error', error: 'Failed to generate search queries' };
                return;
            }
            context = { ...context, ...queriesResult.data };

            // Step 2: Retrieve context
            logger.debug('[ChatAgent.stream] Retrieving context');
            const retrieveResult = await retrieveContextStep.execute(context);
            if (!retrieveResult.success) {
                yield { type: 'error', error: 'Failed to retrieve context' };
                return;
            }
            context = { ...context, ...retrieveResult.data };

            // Check if we have context
            if (!context.contextString || context.retrievedDocuments?.length === 0) {
                yield { type: 'token', content: 'Tôi không tìm thấy thông tin liên quan trong tài liệu. Vui lòng thử hỏi theo cách khác.' };
                yield { type: 'done' };
                return;
            }

            // Step 3: Stream the answer using LlmTool
            logger.debug('[ChatAgent.stream] Streaming answer generation');
            const llmTool = new LlmTool();

            const messages = [
                CHAT_SYSTEM_PROMPT.build(),
                ...context.conversationHistory.slice(-6).map((h) => ({
                    role: h.role as 'user' | 'assistant',
                    content: h.content,
                })),
                {
                    role: 'user' as const,
                    content: buildUserMessageWithContext(context.userQuery, context.contextString),
                },
            ];

            let fullResponse = '';
            const stream = llmTool.streamRun({ messages });

            for await (const chunk of stream) {
                fullResponse += chunk.content;
                yield { type: 'token', content: chunk.content };
            }

            // Step 4: Generate suggestions after streaming is complete
            logger.debug('[ChatAgent.stream] Generating suggestions');
            const suggestions = await this.generateSuggestionsInternal(
                context.userQuery,
                fullResponse,
                context.contextString
            );

            if (suggestions.length > 0) {
                yield { type: 'suggestions', suggestions };
            }

            yield { type: 'done' };

            logger.info('[ChatAgent] Stream completed successfully', {
                answerLength: fullResponse.length,
                suggestionCount: suggestions.length
            });

        } catch (error) {
            logger.error('[ChatAgent] Stream failed', {
                pdfId: input.pdfId,
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
            historyLength: input.conversationHistory.length
        });

        if (!input.userId) {
            throw new Error('userId is required for library search');
        }

        try {
            // Use GlobalRetrieveContextStep instead of regular retrieval
            const globalRetrieveStep = new GlobalRetrieveContextStep();
            const generateAnswerStep = new GenerateAnswerStep();
            const generateSuggestionsStep = new GenerateSuggestionsStep();

            let context: IChatContext = {
                userQuery: input.userQuery,
                userId: input.userId,
                conversationHistory: input.conversationHistory,
            };

            // Step 1: Retrieve from library
            logger.debug('[ChatAgent] Retrieving from library');
            const retrieveResult = await globalRetrieveStep.execute(context);
            if (!retrieveResult.success) {
                throw new Error('Failed to retrieve from library');
            }
            context = { ...context, ...retrieveResult.data };

            // Step 2: Generate answer
            logger.debug('[ChatAgent] Generating answer');
            const answerResult = await generateAnswerStep.execute(context);
            if (!answerResult.success) {
                throw new Error('Failed to generate answer');
            }
            context = { ...context, ...answerResult.data };

            // Step 3: Generate suggestions
            logger.debug('[ChatAgent] Generating suggestions');
            const suggestionsResult = await generateSuggestionsStep.execute(context);
            if (!suggestionsResult.success) {
                logger.warn('[ChatAgent] Failed to generate suggestions, continuing anyway');
            } else {
                context = { ...context, ...suggestionsResult.data };
            }

            logger.info('[ChatAgent] Library question answered successfully', {
                answerLength: context.answer?.length || 0,
                suggestionCount: context.suggestions?.length || 0
            });

            return {
                answer: context.answer || '',
                suggestions: context.suggestions || [],
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


    /**
     * Internal helper to generate suggestions
     */
    private async generateSuggestionsInternal(
        question: string,
        answer: string,
        context: string
    ): Promise<string[]> {
        try {
            const llm = new LlmTool();

            const messages = [
                CHAT_SUGGESTIONS_PROMPT.build(),
                {
                    role: 'user' as const,
                    content: `User asked: "${question}"
AI answered: "${answer.substring(0, 500)}"

Available context: "${context.substring(0, 1000)}"

Generate 3 follow-up questions:`,
                },
            ];

            const response = await llm.execute({ messages });
            const content = response.content.trim();
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const suggestions = JSON.parse(jsonMatch[0]);
                return suggestions.slice(0, 3);
            }
            return [];
        } catch (e) {
            logger.warn('[ChatAgent] Failed to generate suggestions', { error: (e as Error).message });
            return [];
        }
    }
}

