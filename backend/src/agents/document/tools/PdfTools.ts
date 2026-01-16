import { Tool } from '../../core/Tool';
import * as fs from 'fs/promises';
const pdfParse = require('pdf-parse');

export interface PdfParseInput {
    filePath: string;
}

export interface PdfParseOutput {
    text: string;
    pageCount: number;
    info: any;
}

export class PdfParseTool extends Tool<PdfParseInput, PdfParseOutput> {
    name = 'PdfParseTool';
    description = 'Extracts text from a PDF file using pdf-parse.';

    protected async run(input: PdfParseInput): Promise<PdfParseOutput> {
        const dataBuffer = await fs.readFile(input.filePath);
        const data = await pdfParse(dataBuffer);

        return {
            text: data.text,
            pageCount: data.numpages,
            info: data.info,
        };
    }
}
