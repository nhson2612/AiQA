import { Workflow } from '../../core/Workflow';
import { IChatContext } from '../types';
import {
    GenerateSearchQueriesStep,
    RetrieveContextStep,
    GenerateAnswerStep,
    GenerateSuggestionsStep,
} from '../steps';

export class AnswerQuestionWorkflow extends Workflow<IChatContext> {
    name = 'AnswerQuestionWorkflow';

    constructor() {
        super([
            new GenerateSearchQueriesStep(),
            new RetrieveContextStep(),
            new GenerateAnswerStep(),
            new GenerateSuggestionsStep(),
        ]);
    }
}
