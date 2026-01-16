import { StreamingWorkflow } from '../../core/StreamingWorkflow';
import { IStep, IStreamingStep } from '../../core/types';
import { IChatContext } from '../types';
import { GlobalRetrieveContextStep } from '../steps/GlobalRetrieveContextStep';
import { GenerateAnswerStreamStep } from '../steps/GenerateAnswerStreamStep';
import { GenerateSuggestionsStep } from '../steps/GenerateSuggestionsStep';

/**
 * Streaming workflow for library-wide Q&A
 * Pipeline: Global Retrieve -> Stream Answer -> Generate Suggestions
 */
export class AnswerLibraryStreamWorkflow extends StreamingWorkflow<IChatContext> {
    name = 'AnswerLibraryStreamWorkflow';

    protected getPreparationSteps(): IStep<IChatContext>[] {
        return [
            new GlobalRetrieveContextStep(),
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
