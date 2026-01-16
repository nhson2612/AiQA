import { Workflow } from '../../core/Workflow';
import { IChatContext } from '../types';
import { GlobalRetrieveContextStep } from '../steps/GlobalRetrieveContextStep';
import { GenerateAnswerStep } from '../steps/GenerateAnswerStep';
import { GenerateSuggestionsStep } from '../steps/GenerateSuggestionsStep';

/**
 * Non-streaming workflow for library-wide Q&A
 * Pipeline: Global Retrieve -> Generate Answer -> Generate Suggestions
 */
export class AnswerLibraryWorkflow extends Workflow<IChatContext> {
    name = 'AnswerLibraryWorkflow';

    constructor() {
        super([
            new GlobalRetrieveContextStep(),
            new GenerateAnswerStep(),
            new GenerateSuggestionsStep(),
        ]);
    }
}
