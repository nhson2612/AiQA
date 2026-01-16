import { Step } from '../../core/Step';
import { IStepResult } from '../../core/types';
import { IChatContext } from '../types';
import { LlmTool } from '../../core/tools/LlmTool';
import { CHAT_SUGGESTIONS_PROMPT } from '../../../prompts';

export class GenerateSuggestionsStep extends Step<IChatContext> {
    name = 'GenerateSuggestionsStep';
    description = 'Generates follow-up question suggestions.';

    protected async run(context: IChatContext): Promise<IStepResult> {
        if (!context.answer || !context.contextString) {
            return { success: true, data: { suggestions: [] } };
        }

        const llm = new LlmTool();

        const messages = [
            CHAT_SUGGESTIONS_PROMPT.build(),
            {
                role: 'user' as const,
                content: `User asked: "${context.userQuery}"
AI answered: "${context.answer.substring(0, 500)}"

Available context: "${context.contextString.substring(0, 1000)}"

Generate 3 follow-up questions:`,
            },
        ];

        try {
            const response = await llm.execute({ messages });
            const content = response.content.trim();
            const jsonMatch = content.match(/\[[\s\S]*\]/);

            if (jsonMatch) {
                const suggestions = JSON.parse(jsonMatch[0]);
                return { success: true, data: { suggestions: suggestions.slice(0, 3) } };
            }
            return { success: true, data: { suggestions: [] } };
        } catch {
            return { success: true, data: { suggestions: [] } };
        }
    }
}
