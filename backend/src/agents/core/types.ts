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

/**
 * Generic streaming chunk interface
 */
export interface IStreamChunk<T = any> {
    type: 'token' | 'data' | 'error' | 'done';
    content?: string;  // For token chunks (streaming text)
    data?: T;          // For structured data chunks (e.g., suggestions, metadata)
    error?: string;    // For error chunks
}

/**
 * Streaming step interface - extends regular Step with streaming capability
 */
export interface IStreamingStep<TContext extends IWorkflowContext, TChunk = any> extends IStep<TContext> {
    /**
     * Stream execution - yields chunks progressively
     */
    stream(context: TContext): AsyncGenerator<IStreamChunk<TChunk>>;
}
