export interface IAgent<TConfig = any> {
    name: string;
    description: string;
    execute(input: any): Promise<any>;
}

export interface IWorkflowContext {
    [key: string]: any;
}

export interface IStepResult {
    success: boolean;
    data?: any;
    error?: Error;
    metadata?: Record<string, any>;
}

export interface IStep<TContext extends IWorkflowContext = IWorkflowContext> {
    name: string;
    description: string;
    execute(context: TContext): Promise<IStepResult>;
}

export interface ITool<TInput = any, TOutput = any> {
    name: string;
    description: string;
    execute(input: TInput): Promise<TOutput>;
}
