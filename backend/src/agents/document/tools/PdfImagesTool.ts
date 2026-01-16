import { Tool } from '../../core/Tool';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

export interface PdfImagesInput {
    filePath: string;
    outputDir: string;
}

export interface PdfImagesOutput {
    images: Map<number, string[]>; // Map<PageNumber, ImagePaths[]>
}

export class PdfImagesTool extends Tool<PdfImagesInput, PdfImagesOutput> {
    name = 'PdfImagesTool';
    description = 'Extracts images from a PDF file using poppler-utils (pdfimages).';

    protected async run(input: PdfImagesInput): Promise<PdfImagesOutput> {
        const imagePrefix = path.join(input.outputDir, 'img');

        // pdfimages -png -p "input.pdf" "output/img"
        await execAsync(`pdfimages -png -p "${input.filePath}" "${imagePrefix}"`);

        // List extracted images
        const files = await fs.readdir(input.outputDir);
        const imageFiles = files.filter((f) => f.startsWith('img-') && f.endsWith('.png'));

        // Organize by page number
        // pdfimages names files like: img-000-001.png (page 1, image 1) -> regex: img-(\d+)-\d+\.png
        // Page num in filename is 0-indexed (usually), but verify standard behavior
        const pageImages = new Map<number, string[]>();

        for (const file of imageFiles) {
            const match = file.match(/img-(\d+)-\d+\.png/);
            if (match) {
                const pageNum = parseInt(match[1], 10); // pdfimages with -p uses 1-based page index
                const fullPath = path.join(input.outputDir, file);

                if (!pageImages.has(pageNum)) {
                    pageImages.set(pageNum, []);
                }
                pageImages.get(pageNum)!.push(fullPath);
            }
        }

        return { images: pageImages };
    }
}
