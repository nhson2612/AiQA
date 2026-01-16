import { IAgent } from '../core/types';
import { GenerateMindmapWorkflow } from './workflows/GenerateMindmapWorkflow';
import { IMindmapContext, IMindmapNode, IMindmapEdge } from './types';

export interface MindmapAgentInput {
    task: 'generate_mindmap';
    pdfId: string;
    pdfName: string;
}

export interface MindmapAgentOutput {
    nodes: IMindmapNode[];
    edges: IMindmapEdge[];
}

export class MindmapAgent implements IAgent {
    name = 'MindmapAgent';
    description = 'Agent for generating mind maps from documents.';

    async execute(input: MindmapAgentInput): Promise<MindmapAgentOutput> {
        switch (input.task) {
            case 'generate_mindmap':
                return this.generateMindmap(input);
            default:
                throw new Error(`Unknown task: ${(input as any).task}`);
        }
    }

    private async generateMindmap(input: MindmapAgentInput): Promise<MindmapAgentOutput> {
        console.log(`[MindmapAgent] Generating mindmap for PDF: ${input.pdfId}`);

        const workflow = new GenerateMindmapWorkflow();
        const initialContext: IMindmapContext = {
            pdfId: input.pdfId,
            pdfName: input.pdfName,
        };

        const resultContext = await workflow.execute(initialContext);

        return {
            nodes: resultContext.nodes || [],
            edges: resultContext.edges || [],
        };
    }
}
