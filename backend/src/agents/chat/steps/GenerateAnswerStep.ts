import { Step } from '../../core/Step';
import { IStepResult } from '../../core/types';
import { IChatContext } from '../types';
import { LlmTool } from '../../core/tools/LlmTool';
import { CHAT_SYSTEM_PROMPT, buildUserMessageWithContext } from '../../../prompts';

export class GenerateAnswerStep extends Step<IChatContext> {
    name = 'GenerateAnswerStep';
    description = 'Generates an answer using LLM based on retrieved context.';

    protected async run(context: IChatContext): Promise<IStepResult> {
        if (!context.contextString || context.retrievedDocuments?.length === 0) {
            return {
                success: true,
                data: {
                    answer: 'Tôi không tìm thấy thông tin liên quan trong tài liệu. Vui lòng thử hỏi theo cách khác.',
                },
            };
        }

        const llm = new LlmTool();

        const messages = [
            CHAT_SYSTEM_PROMPT.build(),
            ...context.conversationHistory.slice(-6).map((h) => ({
                role: h.role as 'user' | 'assistant',
                content: h.content,
            })),
            {
                role: 'user' as const,
                content: buildUserMessageWithContext(context.userQuery, context.contextString),
            },
        ];

        const response = await llm.execute({ messages });

        return {
            success: true,
            data: { answer: response.content },
        };
    }
}
