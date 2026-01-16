import { Step } from '../../core/Step';
import { IWorkflowContext, IStepResult } from '../../core/types';
import { PdfParseTool } from '../tools/PdfTools';

export interface IDocumentContext extends IWorkflowContext {
    filePath: string;
    rawText?: string;
    totalPages?: number;
    info?: any;
}

export class ExtractTextStep extends Step<IDocumentContext> {
    name = 'ExtractTextStep';
    description = 'Extracts raw text from the PDF using PdfParseTool.';

    protected async run(context: IDocumentContext): Promise<IStepResult> {
        if (!context.filePath) {
            throw new Error('Missing filePath in context');
        }

        const tool = new PdfParseTool();
        const result = await tool.execute({ filePath: context.filePath });

        return {
            success: true,
            data: {
                rawText: result.text,
                totalPages: result.pageCount,
                info: result.info
            }
        };
    }
}
