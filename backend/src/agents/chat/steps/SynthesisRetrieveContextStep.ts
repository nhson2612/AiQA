import { Step } from '../../core/Step';
import { IStepResult } from '../../core/types';
import { IChatContext } from '../types';
import { buildGlobalRetriever } from '../../../services/globalRetriever.service';
import logger from '../../../services/logger.service';

/**
 * Retrieves context from SELECTED user's PDFs (Scoped Synthesis Search)
 * Uses selectedPdfIds from context to filter the search
 */
export class SynthesisRetrieveContextStep extends Step<IChatContext> {
    name = 'SynthesisRetrieveContextStep';
    description = 'Retrieves context from selected PDFs for synthesis using scoped retriever.';

    protected async run(context: IChatContext): Promise<IStepResult> {
        if (!context.userId) {
            logger.error('[SynthesisRetrieveContextStep] userId is required for synthesis');
            return {
                success: false,
                error: new Error('userId is required for synthesis retrieval'),
            };
        }

        if (!context.selectedPdfIds || context.selectedPdfIds.length === 0) {
            logger.error('[SynthesisRetrieveContextStep] selectedPdfIds is required for synthesis');
            return {
                success: false,
                error: new Error('selectedPdfIds is required for synthesis retrieval'),
            };
        }

        logger.debug('[SynthesisRetrieveContextStep] Building scoped retriever', {
            userId: context.userId,
            selectedPdfCount: context.selectedPdfIds.length,
        });

        // Build scoped retriever with selected PDF IDs
        const retriever = await buildGlobalRetriever(context.userId, context.selectedPdfIds);
        const query = context.searchQueries?.[0] || context.userQuery;

        logger.debug('[SynthesisRetrieveContextStep] Executing scoped search', { query });
        const documents = await retriever(query);

        logger.info('[SynthesisRetrieveContextStep] Retrieved documents', {
            count: documents.length,
            fromPdfs: context.selectedPdfIds.length,
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
