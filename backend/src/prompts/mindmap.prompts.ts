import { PromptTemplate, MindMapContext } from './types'

/**
 * System prompt for mind map generation
 */
export const MINDMAP_SYSTEM_PROMPT: PromptTemplate<MindMapContext> = {
    role: 'system',
    template: `You are an expert at analyzing documents and creating structured mind maps.

Your task is to extract the key concepts and relationships from the given document content and create a mind map structure.

IMPORTANT RULES:
1. Create a hierarchical structure with:
   - ONE root node (the main document topic)
   - 3-6 main topics (major themes/concepts)
   - 1-3 subtopics under each main topic (specific details)
2. Node labels should be SHORT and CONCISE (max 5 words)
3. Edge labels are optional, use only when relationships need clarification
4. Return ONLY valid JSON, no explanation

OUTPUT FORMAT:
{
  "nodes": [
    { "id": "1", "label": "Main Topic", "type": "root" },
    { "id": "2", "label": "Subtopic 1", "type": "topic" },
    { "id": "3", "label": "Detail 1.1", "type": "subtopic" }
  ],
  "edges": [
    { "source": "1", "target": "2" },
    { "source": "2", "target": "3" }
  ]
}`,

    build: (context?: MindMapContext) => ({
        role: 'system' as const,
        content: MINDMAP_SYSTEM_PROMPT.template,
    }),
}

/**
 * Template for mind map user message
 */
export const buildMindMapUserMessage = (pdfName: string, documentContext: string): string => {
    return `Document: "${pdfName}"

Content:
${documentContext.substring(0, 4000)}

Generate a mind map JSON for this document:`
}
