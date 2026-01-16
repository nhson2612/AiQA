import * as path from 'path'
import { DocumentAgent } from '../agents/document/DocumentAgent'

export interface PageContent {
    pageNumber: number
    content: string
    hasImages: boolean
    imageCount: number
}

export interface ProcessedPdf {
    pages: PageContent[]
    totalPages: number
    fileName: string
}

/**
 * Process entire PDF file
 * Refactored to use the Agentic Architecture (DocumentAgent)
 */
export async function processPdf(filePath: string): Promise<ProcessedPdf> {
    console.log(`🔧 Loading PDF via DocumentAgent: ${filePath}`)

    const agent = new DocumentAgent();

    try {
        const result = await agent.execute({
            task: 'ingest_pdf',
            filePath: filePath
        });

        // The agent returns a similar structure, but let's ensure type compatibility
        return {
            pages: result.pages,
            totalPages: result.totalPages,
            fileName: unescape(path.basename(filePath)), // Basic cleanup
        } as ProcessedPdf;

    } catch (error) {
        console.error('DocumentAgent failed:', error);
        throw error;
    }
}

