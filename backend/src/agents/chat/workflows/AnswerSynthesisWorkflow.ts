import { Workflow } from '../../core/Workflow';
import { IChatContext } from '../types';
import { SynthesisRetrieveContextStep } from '../steps/SynthesisRetrieveContextStep';
import { GenerateAnswerStep } from '../steps/GenerateAnswerStep';
import { GenerateSuggestionsStep } from '../steps/GenerateSuggestionsStep';

/**
 * Non-streaming workflow for multi-document synthesis
 * Pipeline: Synthesis Retrieve -> Generate Answer -> Generate Suggestions
 */
export class AnswerSynthesisWorkflow extends Workflow<IChatContext> {
    name = 'AnswerSynthesisWorkflow';

    constructor() {
        super([
            new SynthesisRetrieveContextStep(),
            new GenerateAnswerStep(),
            new GenerateSuggestionsStep(),
        ]);
    }
}

