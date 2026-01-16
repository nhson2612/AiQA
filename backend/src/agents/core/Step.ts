import { IStep, IStepResult, IWorkflowContext } from './types';

export abstract class Step<TContext extends IWorkflowContext> implements IStep<TContext> {
    abstract name: string;
    abstract description: string;

    async execute(context: TContext): Promise<IStepResult> {
        try {
            console.log(`[Step] Starting: ${this.name}`);
            const result = await this.run(context);
            console.log(`[Step] Completed: ${this.name}`);
            return result;
        } catch (error) {
            console.error(`[Step] Failed: ${this.name}`, error);
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    }

    protected abstract run(context: TContext): Promise<IStepResult>;
}
