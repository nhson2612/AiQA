import { Step } from '../../core/Step';
import { IStepResult } from '../../core/types';
import { IChatContext } from '../types';
import { buildGlobalRetriever } from '../../../services/globalRetriever.service';
import logger from '../../../services/logger.service';

/**
 * Retrieves context from ALL user's PDFs (Global Search)
 */
export class GlobalRetrieveContextStep extends Step<IChatContext> {
    name = 'GlobalRetrieveContextStep';
    description = 'Retrieves context from all PDFs in user library using global retriever.';

    protected async run(context: IChatContext): Promise<IStepResult> {
        if (!context.userId) {
            logger.error('[GlobalRetrieveContextStep] userId is required for global search');
            return {
                success: false,
                error: new Error('userId is required for global retrieval'),
            };
        }

        logger.debug('[GlobalRetrieveContextStep] Building global retriever', {
            userId: context.userId,
        });

        const retriever = await buildGlobalRetriever(context.userId);
        const query = context.searchQueries?.[0] || context.userQuery;

        logger.debug('[GlobalRetrieveContextStep] Executing global search', { query });
        const documents = await retriever(query);

        logger.info('[GlobalRetrieveContextStep] Retrieved documents', {
            count: documents.length,
        });

        if (documents.length === 0) {
            return {
                success: true,
                data: {
                    retrievedDocuments: [],
                    contextString: '',
                },
            };
        }

        // Build context string with PDF citations
        const contextString = documents
            .map((d) => {
                const pageNum = d.metadata?.pageNumber as number | undefined;
                const pageRef = pageNum
                    ? `[${d.pdfName} - Trang ${pageNum}]`
                    : `[${d.pdfName}]`;
                return `${pageRef}\n${d.pageContent}`;
            })
            .join('\n\n---\n\n');

        return {
            success: true,
            data: {
                retrievedDocuments: documents,
                contextString,
            },
        };
    }
}
