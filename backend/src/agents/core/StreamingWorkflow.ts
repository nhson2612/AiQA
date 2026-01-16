import { IStep, IWorkflowContext, IStepResult, IStreamingStep, IStreamChunk } from './types';
import logger from '../../services/logger.service';

/**
 * Base class for streaming workflows
 * Enables progressive streaming of results while maintaining step-based architecture
 */
export abstract class StreamingWorkflow<TContext extends IWorkflowContext, TChunk = any> {
    abstract name: string;

    /**
     * Steps to run BEFORE streaming starts (build context, retrieve data, etc.)
     */
    protected abstract getPreparationSteps(): IStep<TContext>[];

    /**
     * The main streaming step that yields chunks
     */
    protected abstract getStreamingStep(): IStreamingStep<TContext, TChunk>;

    /**
     * Optional: Steps to run AFTER streaming completes (e.g., post-processing, suggestions)
     */
    protected getPostSteps(): IStep<TContext>[] {
        return [];
    }

    /**
     * Execute the streaming workflow
     */
    async *execute(initialContext: TContext): AsyncGenerator<IStreamChunk<TChunk>> {
        logger.info(`[StreamingWorkflow] Starting: ${this.name}`);
        let context = { ...initialContext };

        try {
            // Phase 1: Run preparation steps synchronously
            for (const step of this.getPreparationSteps()) {
                logger.debug(`[StreamingWorkflow] Executing preparation step: ${step.name}`);
                const result = await step.execute(context);

                if (!result.success) {
                    logger.error(`[StreamingWorkflow] Preparation step failed: ${step.name}`, {
                        error: result.error?.message
                    });
                    yield { type: 'error', error: result.error?.message || `Step ${step.name} failed` };
                    return;
                }

                // Merge result into context
                context = { ...context, ...result.data };
            }

            // Phase 2: Run streaming step
            logger.debug(`[StreamingWorkflow] Starting streaming step`);
            const streamingStep = this.getStreamingStep();

            for await (const chunk of streamingStep.stream(context)) {
                yield chunk;

                // Update context if chunk contains data
                if (chunk.type === 'data' && chunk.data) {
                    context = { ...context, ...chunk.data };
                }
            }

            // Phase 3: Run post-processing steps
            for (const step of this.getPostSteps()) {
                logger.debug(`[StreamingWorkflow] Executing post step: ${step.name}`);
                const result = await step.execute(context);

                if (result.success && result.data) {
                    // Yield post-step results as data chunks
                    yield { type: 'data', data: result.data };
                    context = { ...context, ...result.data };
                }
            }

            yield { type: 'done' };
            logger.info(`[StreamingWorkflow] Completed: ${this.name}`);

        } catch (error) {
            logger.error(`[StreamingWorkflow] Failed: ${this.name}`, {
                error: (error as Error).message,
                stack: (error as Error).stack
            });
            yield { type: 'error', error: (error as Error).message };
        }
    }
}
