import { Tool } from '../../core/Tool';
import tesseract from 'node-tesseract-ocr';

export interface OcrInput {
    imagePath: string;
    config?: object;
}

export interface OcrOutput {
    text: string;
}

const DEFAULT_CONFIG = {
    lang: 'vie+eng',
    oem: 1,
    psm: 3,
};

export class TesseractTool extends Tool<OcrInput, OcrOutput> {
    name = 'TesseractTool';
    description = 'Performs OCR on an image file using Tesseract.';

    protected async run(input: OcrInput): Promise<OcrOutput> {
        const config = { ...DEFAULT_CONFIG, ...input.config };

        try {
            const text = await tesseract.recognize(input.imagePath, config);
            return { text: text.trim() };
        } catch (error) {
            console.warn(`[TesseractTool] OCR failed for ${input.imagePath}`, error);
            return { text: '' };
        }
    }
}
