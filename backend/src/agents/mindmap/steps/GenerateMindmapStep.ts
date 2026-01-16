import { Step } from '../../core/Step';
import { IStepResult } from '../../core/types';
import { IMindmapContext, IMindmapNode, IMindmapEdge } from '../types';
import { LlmTool } from '../../core/tools/LlmTool';
import { MINDMAP_SYSTEM_PROMPT, buildMindMapUserMessage } from '../../../prompts';

export class GenerateMindmapStep extends Step<IMindmapContext> {
    name = 'GenerateMindmapStep';
    description = 'Generates mindmap structure using LLM.';

    protected async run(context: IMindmapContext): Promise<IStepResult> {
        const documentContext = (context.documentChunks || []).join('\n\n---\n\n');

        if (!documentContext.trim()) {
            return {
                success: true,
                data: {
                    nodes: [{ id: '1', label: context.pdfName, type: 'root' }],
                    edges: [],
                },
            };
        }

        const llm = new LlmTool();

        try {
            const response = await llm.execute({
                messages: [
                    MINDMAP_SYSTEM_PROMPT.build(),
                    { role: 'user', content: buildMindMapUserMessage(context.pdfName, documentContext) },
                ],
            });

            const content = response.content.trim();
            const jsonMatch = content.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const mindMapData = JSON.parse(jsonMatch[0]) as { nodes: IMindmapNode[]; edges: IMindmapEdge[] };

                if (!mindMapData.nodes || !Array.isArray(mindMapData.nodes)) {
                    throw new Error('Invalid nodes array');
                }
                if (!mindMapData.edges || !Array.isArray(mindMapData.edges)) {
                    mindMapData.edges = [];
                }

                mindMapData.nodes = mindMapData.nodes.map((node, index) => ({
                    id: node.id || String(index + 1),
                    label: node.label || 'Unknown',
                    type: node.type || (index === 0 ? 'root' : 'topic'),
                    description: node.description,
                }));

                return {
                    success: true,
                    data: {
                        nodes: mindMapData.nodes,
                        edges: mindMapData.edges,
                    },
                };
            }

            throw new Error('No valid JSON found');
        } catch (error) {
            // Fallback mindmap
            return {
                success: true,
                data: {
                    nodes: [
                        { id: '1', label: context.pdfName, type: 'root' },
                        { id: '2', label: 'Content Analysis', type: 'topic' },
                        { id: '3', label: 'Key Topics', type: 'topic' },
                    ],
                    edges: [
                        { source: '1', target: '2' },
                        { source: '1', target: '3' },
                    ],
                },
            };
        }
    }
}
