import { IStep, IStepResult, IWorkflowContext } from './types';
import logger from '../../services/logger.service';

export abstract class Step<TContext extends IWorkflowContext> implements IStep<TContext> {
    abstract name: string;
    abstract description: string;

    async execute(context: TContext): Promise<IStepResult> {
        try {
            logger.debug(`[Step] Starting: ${this.name}`);
            const result = await this.run(context);
            logger.debug(`[Step] Completed: ${this.name}`);
            return result;
        } catch (error) {
            logger.error(`[Step] Failed: ${this.name}`, { error });
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    }

    protected abstract run(context: TContext): Promise<IStepResult>;
}
