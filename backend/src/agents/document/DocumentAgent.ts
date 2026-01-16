import { IAgent } from '../core/types';
import { IngestPdfWorkflow } from './workflows/IngestPdfWorkflow';
import { IProcessedDocumentContext } from './steps/ProcessImagesStep';
import logger from '../../services/logger.service';

export class DocumentAgent implements IAgent {
    name = 'DocumentAgent';
    description = 'Agent responsible for handling document processing tasks like ingestion and OCR.';

    async execute(input: { task: 'ingest_pdf', filePath: string }): Promise<any> {
        switch (input.task) {
            case 'ingest_pdf':
                return this.ingestPdf(input.filePath);
            default:
                throw new Error(`Unknown task: ${(input as any).task}`);
        }
    }

    private async ingestPdf(filePath: string): Promise<any> {
        logger.info(`[DocumentAgent] Starting PDF Ingestion for: ${filePath}`);

        const workflow = new IngestPdfWorkflow();
        const initialContext: IProcessedDocumentContext = { filePath };

        const resultContext = await workflow.execute(initialContext);

        return {
            pages: resultContext.processedPages,
            totalPages: resultContext.totalPages,
            fileName: filePath.split('/').pop() // simplistic
        };
    }
}
