import { StreamingWorkflow } from '../../core/StreamingWorkflow';
import { IStep, IStreamingStep } from '../../core/types';
import { IChatContext } from '../types';
import { SynthesisRetrieveContextStep } from '../steps/SynthesisRetrieveContextStep';
import { GenerateAnswerStreamStep } from '../steps/GenerateAnswerStreamStep';
import { GenerateSuggestionsStep } from '../steps/GenerateSuggestionsStep';

/**
 * Streaming workflow for multi-document synthesis
 * Pipeline: Synthesis Retrieve -> Stream Answer -> Generate Suggestions
 */
export class AnswerSynthesisStreamWorkflow extends StreamingWorkflow<IChatContext> {
    name = 'AnswerSynthesisStreamWorkflow';

    protected getPreparationSteps(): IStep<IChatContext>[] {
        return [
            new SynthesisRetrieveContextStep(),
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
