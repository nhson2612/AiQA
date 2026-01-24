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

const THINKING_START = '<thinking>';
const THINKING_END = '</thinking>';

const stripThinkingTags = (text: string): string => {
    return text.replace(/<think>[\s\S]*?<\/think>/g, '');
};

type ThinkingFilterState = {
    inThinking: boolean;
    buffer: string;
};

const filterThinkingFromStreamChunk = (text: string, state: ThinkingFilterState): string => {
    const startKeep = THINKING_START.length - 1;
    const endKeep = THINKING_END.length - 1;
    let output = '';

    state.buffer += text;

    while (true) {
        if (state.inThinking) {
            const endIdx = state.buffer.indexOf(THINKING_END);
            if (endIdx === -1) {
                if (state.buffer.length > endKeep) {
                    state.buffer = state.buffer.slice(state.buffer.length - endKeep);
                }
                return output;
            }
            state.buffer = state.buffer.slice(endIdx + THINKING_END.length);
            state.inThinking = false;
            continue;
        }

        const startIdx = state.buffer.indexOf(THINKING_START);
        if (startIdx === -1) {
            if (state.buffer.length > startKeep) {
                output += state.buffer.slice(0, state.buffer.length - startKeep);
                state.buffer = state.buffer.slice(state.buffer.length - startKeep);
            }
            return output;
        }

        output += state.buffer.slice(0, startIdx);
        state.buffer = state.buffer.slice(startIdx + THINKING_START.length);
        state.inThinking = true;
    }
};

const finalizeThinkingFilter = (state: ThinkingFilterState): string => {
    if (state.inThinking) {
        state.buffer = '';
        return '';
    }

    let output = state.buffer;
    for (let i = 1; i < THINKING_START.length; i++) {
        const partial = THINKING_START.slice(0, i);
        if (output.endsWith(partial)) {
            output = output.slice(0, -i);
            break;
        }
    }

    state.buffer = '';
    return output;
};

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
        return { content: stripThinkingTags(content) };
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

        const state: ThinkingFilterState = { inThinking: false, buffer: '' };

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (!content) {
                continue;
            }
            const filtered = filterThinkingFromStreamChunk(content, state);
            if (filtered) {
                yield { content: filtered };
            }
        }

        const tail = finalizeThinkingFilter(state);
        if (tail) {
            yield { content: tail };
        }
    }
}
