import { Step } from '../../core/Step';
import { IStepResult } from '../../core/types';
import { IChatContext } from '../types';
import { RetrieverTool } from '../../core/tools/RetrieverTool';

const RAG_TOP_K = parseInt(process.env.RAG_TOP_K || '5', 10);

export class RetrieveContextStep extends Step<IChatContext> {
    name = 'RetrieveContextStep';
    description = 'Retrieves relevant documents from vector store.';

    protected async run(context: IChatContext): Promise<IStepResult> {
        // Validate pdfId exists (required for PDF-specific retrieval)
        if (!context.pdfId) {
            return {
                success: false,
                error: new Error('pdfId is required for document retrieval'),
            };
        }

        const retriever = new RetrieverTool();
        const queries = context.searchQueries || [context.userQuery];

        const allDocs: { pageContent: string; metadata?: Record<string, any> }[] = [];
        const seenContent = new Set<string>();

        for (const query of queries) {
            const result = await retriever.execute({
                query,
                namespace: context.pdfId,
                topK: 6,
            });

            for (const doc of result.documents) {
                const contentKey = doc.pageContent.substring(0, 100).toLowerCase();
                if (!seenContent.has(contentKey)) {
                    seenContent.add(contentKey);
                    allDocs.push(doc);
                }
            }
        }

        const topDocs = allDocs.slice(0, RAG_TOP_K);

        // Build context string with citations
        const contextString = topDocs.map((d) => {
            const pageNum = d.metadata?.pageNumber;
            const pageRef = pageNum ? `[Trang ${pageNum}]` : '';
            return `${pageRef}\n${d.pageContent}`;
        }).join('\n\n---\n\n');

        return {
            success: true,
            data: {
                retrievedDocuments: topDocs,
                contextString,
            },
        };
    }
}
