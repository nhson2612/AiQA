import { Tool } from '../Tool';
import Groq from 'groq-sdk';

export interface LlmInput {
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
    streaming?: boolean;
}

export interface LlmOutput {
    content: string;
}

export interface LlmStreamOutput {
    stream: AsyncGenerator<{ content: string }>;
}

/**
 * LLM Tool using Groq API.
 * Can be used for both streaming and non-streaming responses.
 */
export class LlmTool extends Tool<LlmInput, LlmOutput> {
    name = 'LlmTool';
    description = 'Invokes an LLM (Groq) with given messages.';

    private groq: Groq;
    private model: string;

    constructor() {
        super();
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ_API_KEY is not set');
        }
        this.groq = new Groq({ apiKey });
        this.model = process.env.GROQ_MODEL || 'llama3-8b-8192';
    }

    protected async run(input: LlmInput): Promise<LlmOutput> {
        const chatCompletion = await this.groq.chat.completions.create({
            messages: input.messages.map((m) => ({
                role: m.role as 'system' | 'user' | 'assistant',
                content: m.content,
            })),
            model: this.model,
        });

        const content = chatCompletion.choices[0]?.message?.content || '';
        return { content };
    }

    /**
     * Streaming invocation - returns an async generator
     */
    async *streamRun(input: LlmInput): AsyncGenerator<{ content: string }> {
        const stream = await this.groq.chat.completions.create({
            messages: input.messages.map((m) => ({
                role: m.role as 'system' | 'user' | 'assistant',
                content: m.content,
            })),
            model: this.model,
            stream: true,
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                yield { content };
            }
        }
    }
}
