import { Workflow } from '../../core/Workflow';
import { IProcessedDocumentContext } from '../steps/ProcessImagesStep';
import { ExtractTextStep } from '../steps/ExtractTextStep';
import { ProcessImagesStep } from '../steps/ProcessImagesStep';

export class IngestPdfWorkflow extends Workflow<IProcessedDocumentContext> {
    name = 'IngestPdfWorkflow';

    constructor() {
        super([
            new ExtractTextStep(),
            new ProcessImagesStep()
        ]);
    }
}
