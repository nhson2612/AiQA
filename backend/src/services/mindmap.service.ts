import { MindmapAgent } from '../agents/mindmap/MindmapAgent';

export interface MindMapNode {
    id: string;
    label: string;
    description?: string;
    type: 'root' | 'topic' | 'subtopic';
}

export interface MindMapEdge {
    source: string;
    target: string;
    label?: string;
}

export interface MindMapData {
    nodes: MindMapNode[];
    edges: MindMapEdge[];
}

/**
 * Generate a mind map from a PDF document using MindmapAgent
 */
export const generateMindMap = async (pdfId: string, pdfName: string): Promise<MindMapData> => {
    const agent = new MindmapAgent();

    const result = await agent.execute({
        task: 'generate_mindmap',
        pdfId,
        pdfName,
    });

    return {
        nodes: result.nodes,
        edges: result.edges,
    };
};
