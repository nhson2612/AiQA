import { Step } from '../../core/Step';
import { IStepResult } from '../../core/types';
import { PdfImagesTool } from '../tools/PdfImagesTool';
import { TesseractTool } from '../tools/TesseractTool';
import { IDocumentContext } from './ExtractTextStep';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';

export interface IOcrResult {
    pageNumber: number;
    ocrText: string;
    imageCount: number;
}

export interface IProcessedDocumentContext extends IDocumentContext {
    processedPages?: {
        pageNumber: number;
        content: string;
        hasImages: boolean;
        imageCount: number;
    }[];
}

export class ProcessImagesStep extends Step<IProcessedDocumentContext> {
    name = 'ProcessImagesStep';
    description = 'Extracts images from PDF and runs OCR on them.';

    protected async run(context: IProcessedDocumentContext): Promise<IStepResult> {
        if (!context.filePath) {
            throw new Error('Missing filePath in context');
        }

        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-ocr-'));
        const imagesTool = new PdfImagesTool();
        const tesseractTool = new TesseractTool();

        try {
            // 1. Extract Images
            const extractionResult = await imagesTool.execute({
                filePath: context.filePath,
                outputDir: tempDir
            });

            // 2. Prepare for Page Processing
            const totalPages = context.totalPages || 1;
            const fullText = context.rawText || '';
            const charsPerPage = Math.ceil(fullText.length / totalPages);
            const processedPages = [];

            // 3. Process Per Page (Combine Text + OCR)
            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                // Get Text Segment
                const startIdx = (pageNum - 1) * charsPerPage;
                const endIdx = Math.min(startIdx + charsPerPage, fullText.length);
                const pageText = fullText.substring(startIdx, endIdx).trim();

                // Get Images & OCR
                const images = extractionResult.images.get(pageNum) || [];
                let ocrText = '';

                if (images.length > 0) {
                    const ocrResults = [];
                    for (const imgPath of images) {
                        const ocrRes = await tesseractTool.execute({ imagePath: imgPath });
                        if (ocrRes.text) ocrResults.push(ocrRes.text);
                    }
                    if (ocrResults.length > 0) {
                        ocrText = ocrResults.join('\n');
                    }
                }

                // Merge
                let content = pageText;
                if (ocrText) {
                    content = [pageText, ocrText].filter(Boolean).join('\n\n--- [Text from images/OCR] ---\n\n');
                }

                processedPages.push({
                    pageNumber: pageNum,
                    content: content.trim(),
                    hasImages: images.length > 0,
                    imageCount: images.length
                });
            }

            return {
                success: true,
                data: { processedPages }
            };

        } finally {
            try {
                await fs.rm(tempDir, { recursive: true, force: true });
            } catch { }
        }
    }
}
