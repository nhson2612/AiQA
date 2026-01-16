import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Mock Tools logic to reproduce without full backend
async function testPipeline(pdfPath: string) {
    console.log(`Testing pipeline for: ${pdfPath}`);
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'debug-ocr-'));
    console.log(`Temp dir: ${tempDir}`);

    try {
        const imagePrefix = path.join(tempDir, 'img');

        // 1. Run pdfimages
        console.log('Running pdfimages...');
        await execAsync(`pdfimages -png -p "${pdfPath}" "${imagePrefix}"`);

        // 2. List files
        const files = await fs.readdir(tempDir);
        console.log('Files generated:', files);

        const imageFiles = files.filter((f) => f.startsWith('img-') && f.endsWith('.png'));
        console.log(`Filtered image files (${imageFiles.length}):`, imageFiles);

        // 3. Test Regex
        for (const file of imageFiles) {
            const match = file.match(/img-(\d+)-\d+\.png/);
            if (match) {
                console.log(`  MATCH: ${file} -> Page ${parseInt(match[1], 10) + 1}`);
            } else {
                console.log(`  NO MATCH: ${file}`);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        // cleanup
        // await fs.rm(tempDir, { recursive: true, force: true });
        console.log('Done. Check temp dir if needed.');
    }
}

// Run with provided argument
const pdfArg = process.argv[2];
if (pdfArg) {
    testPipeline(pdfArg);
} else {
    console.log('Please provide pdf path');
}
