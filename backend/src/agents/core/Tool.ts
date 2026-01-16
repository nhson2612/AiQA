import { ITool } from './types';
import logger from '../../services/logger.service';

export abstract class Tool<TInput = any, TOutput = any> implements ITool<TInput, TOutput> {
    abstract name: string;
    abstract description: string;

    async execute(input: TInput): Promise<TOutput> {
        try {
            // logger.debug(`[Tool] Running: ${this.name}`); // Optional detailed logging
            return await this.run(input);
        } catch (error) {
            logger.error(`[Tool] Error in ${this.name}`, { error: (error as Error).message });
            throw error;
        }
    }

    protected abstract run(input: TInput): Promise<TOutput>;
}
