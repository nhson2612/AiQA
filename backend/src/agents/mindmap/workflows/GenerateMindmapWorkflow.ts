import { Workflow } from '../../core/Workflow';
import { IMindmapContext } from '../types';
import { RetrieveChunksStep, GenerateMindmapStep } from '../steps';

export class GenerateMindmapWorkflow extends Workflow<IMindmapContext> {
    name = 'GenerateMindmapWorkflow';

    constructor() {
        super([
            new RetrieveChunksStep(),
            new GenerateMindmapStep(),
        ]);
    }
}
