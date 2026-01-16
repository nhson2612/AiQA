import { ITool } from './types';

export abstract class Tool<TInput = any, TOutput = any> implements ITool<TInput, TOutput> {
    abstract name: string;
    abstract description: string;

    async execute(input: TInput): Promise<TOutput> {
        try {
            // console.log(`[Tool] Running: ${this.name}`); // Optional detailed logging
            return await this.run(input);
        } catch (error) {
            console.error(`[Tool] Error in ${this.name}:`, error);
            throw error;
        }
    }

    protected abstract run(input: TInput): Promise<TOutput>;
}
