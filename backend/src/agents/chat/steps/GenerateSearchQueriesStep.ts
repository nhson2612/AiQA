import { Step } from '../../core/Step';
import { IStepResult } from '../../core/types';
import { IChatContext } from '../types';
import { LlmTool } from '../../core/tools/LlmTool';

const RAG_MULTI_QUERY = process.env.RAG_MULTI_QUERY === 'true';

export class GenerateSearchQueriesStep extends Step<IChatContext> {
    name = 'GenerateSearchQueriesStep';
    description = 'Generates search queries from user input using LLM.';

    protected async run(context: IChatContext): Promise<IStepResult> {
        const llm = new LlmTool();

        const historyContext = context.conversationHistory
            .slice(-4)
            .map((h) => `${h.role}: ${h.content}`)
            .join('\n');

        const messages = [
            {
                role: 'system' as const,
                content: `You are a search query generator for a document Q&A system.

Your task: Generate ${RAG_MULTI_QUERY ? '2-3 diverse' : '1 focused'} search queries to find relevant information.

RULES:
1. Understand the user's TRUE intent from conversation context
2. Resolve references like "that", "it", "this" from previous messages
3. Generate queries in ENGLISH
4. Focus on SEMANTIC meaning

OUTPUT FORMAT: Return ONLY a JSON array of strings.
Example: ["query about main topic", "related concept query"]`,
            },
            {
                role: 'user' as const,
                content: `Recent conversation:\n${historyContext || '(No previous messages)'}\n\nCurrent question: "${context.userQuery}"\n\nGenerate search queries:`,
            },
        ];

        try {
            const response = await llm.execute({ messages });
            const content = response.content.trim();
            const jsonMatch = content.match(/\[[\s\S]*\]/);

            let queries: string[] = [];
            if (jsonMatch) {
                queries = JSON.parse(jsonMatch[0]);
            }

            return {
                success: true,
                data: { searchQueries: queries.length > 0 ? queries : [context.userQuery] },
            };
        } catch {
            return {
                success: true,
                data: { searchQueries: [context.userQuery] },
            };
        }
    }
}
