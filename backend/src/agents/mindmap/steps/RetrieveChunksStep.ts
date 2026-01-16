import { Step } from '../../core/Step';
import { IStepResult } from '../../core/types';
import { IMindmapContext } from '../types';
import { RetrieverTool } from '../../core/tools/RetrieverTool';

export class RetrieveChunksStep extends Step<IMindmapContext> {
    name = 'RetrieveChunksStep';
    description = 'Retrieves document chunks for mindmap generation.';

    protected async run(context: IMindmapContext): Promise<IStepResult> {
        const retriever = new RetrieverTool();

        // Retrieve chunks with different queries to get diverse content
        const queries = [
            'main topics key concepts summary',
            'introduction conclusion methodology',
        ];

        const seenContent = new Set<string>();
        const allContent: string[] = [];

        for (const query of queries) {
            const result = await retriever.execute({
                query,
                namespace: context.pdfId,
                topK: 6,
            });

            for (const doc of result.documents) {
                const key = doc.pageContent.substring(0, 50).toLowerCase();
                if (!seenContent.has(key)) {
                    seenContent.add(key);
                    allContent.push(doc.pageContent);
                }
            }
        }

        return {
            success: true,
            data: { documentChunks: allContent.slice(0, 8) },
        };
    }
}
