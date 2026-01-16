import { IStep, IWorkflowContext, IStepResult } from './types';
import logger from '../../services/logger.service';

export abstract class Workflow<TContext extends IWorkflowContext> {
    abstract name: string;
    protected steps: IStep<TContext>[] = [];

    constructor(steps: IStep<TContext>[]) {
        this.steps = steps;
    }

    async execute(initialContext: TContext): Promise<TContext> {
        logger.info(`[Workflow] Starting: ${this.name}`);
        let context = { ...initialContext };

        for (const step of this.steps) {
            const result = await step.execute(context);

            if (!result.success) {
                logger.error(`[Workflow] Stopped at step '${step.name}': ${result.error?.message}`);
                throw new Error(`Workflow stopped at step '${step.name}': ${result.error?.message}`);
            }

            // Merge result data back into context if provided
            if (result.data) {
                context = { ...context, ...result.data };
            }
        }

        logger.info(`[Workflow] Completed: ${this.name}`);
        return context;
    }
}
