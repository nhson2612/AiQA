import { StreamingWorkflow } from '../../core/StreamingWorkflow';
import { IStep, IStreamingStep } from '../../core/types';
import { IChatContext } from '../types';
import { GenerateSearchQueriesStep } from '../steps/GenerateSearchQueriesStep';
import { RetrieveContextStep } from '../steps/RetrieveContextStep';
import { GenerateAnswerStreamStep } from '../steps/GenerateAnswerStreamStep';
import { GenerateSuggestionsStep } from '../steps/GenerateSuggestionsStep';

/**
 * Streaming workflow for single-document Q&A
 * Pipeline: Generate Queries -> Retrieve Context -> Stream Answer -> Generate Suggestions
 */
export class AnswerQuestionStreamWorkflow extends StreamingWorkflow<IChatContext> {
    name = 'AnswerQuestionStreamWorkflow';

    protected getPreparationSteps(): IStep<IChatContext>[] {
        return [
            new GenerateSearchQueriesStep(),
            new RetrieveContextStep(),
        ];
    }

    protected getStreamingStep(): IStreamingStep<IChatContext> {
        return new GenerateAnswerStreamStep();
    }

    protected getPostSteps(): IStep<IChatContext>[] {
        return [
            new GenerateSuggestionsStep(),
        ];
    }
}
