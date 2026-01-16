import { IStep, IWorkflowContext, IStepResult } from './types';

export abstract class Workflow<TContext extends IWorkflowContext> {
    abstract name: string;
    protected steps: IStep<TContext>[] = [];

    constructor(steps: IStep<TContext>[]) {
        this.steps = steps;
    }

    async execute(initialContext: TContext): Promise<TContext> {
        console.log(`[Workflow] Starting: ${this.name}`);
        let context = { ...initialContext };

        for (const step of this.steps) {
            const result = await step.execute(context);

            if (!result.success) {
                throw new Error(`Workflow stopped at step '${step.name}': ${result.error?.message}`);
            }

            // Merge result data back into context if provided
            if (result.data) {
                context = { ...context, ...result.data };
            }
        }

        console.log(`[Workflow] Completed: ${this.name}`);
        return context;
    }
}
