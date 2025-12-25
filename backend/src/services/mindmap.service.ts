import { buildLLM } from './llm.service'
import { buildRetriever } from './retriever.service'
import { MINDMAP_SYSTEM_PROMPT, buildMindMapUserMessage } from '../prompts'

export interface MindMapNode {
    id: string
    label: string
    description?: string
    type: 'root' | 'topic' | 'subtopic'
}

export interface MindMapEdge {
    source: string
    target: string
    label?: string
}

export interface MindMapData {
    nodes: MindMapNode[]
    edges: MindMapEdge[]
}

/**
 * Generate a mind map from a PDF document using LLM
 */
export const generateMindMap = async (pdfId: string, pdfName: string): Promise<MindMapData> => {
    console.log(`🧠 Generating mind map for PDF: ${pdfId}`)

    // Build retriever to get document content
    const retriever = await buildRetriever({
        conversationId: '',
        pdfId,
        streaming: false,
        metadata: { conversationId: '', userId: '', pdfId },
    })

    // Retrieve representative chunks from the document
    const chunks = await retriever('main topics key concepts summary')
    const additionalChunks = await retriever('introduction conclusion methodology')

    // Combine and deduplicate content
    const seenContent = new Set<string>()
    const allContent: string[] = []

    for (const chunk of [...chunks, ...additionalChunks]) {
        const key = chunk.pageContent.substring(0, 50).toLowerCase()
        if (!seenContent.has(key)) {
            seenContent.add(key)
            allContent.push(chunk.pageContent)
        }
    }

    const documentContext = allContent.slice(0, 8).join('\n\n---\n\n')

    if (!documentContext.trim()) {
        console.warn('⚠️  No content found for mind map generation')
        return {
            nodes: [{ id: '1', label: pdfName, type: 'root' }],
            edges: [],
        }
    }

    // Build LLM
    const llm = buildLLM({
        conversationId: '',
        pdfId,
        streaming: false,
        metadata: { conversationId: '', userId: '', pdfId },
    })

    try {
        const response = await llm.invoke([
            MINDMAP_SYSTEM_PROMPT.build(),
            { role: 'user', content: buildMindMapUserMessage(pdfName, documentContext) },
        ])

        const content = response.content.trim()
        const jsonMatch = content.match(/\{[\s\S]*\}/)

        if (jsonMatch) {
            const mindMapData = JSON.parse(jsonMatch[0]) as MindMapData

            // Validate and sanitize the response
            if (!mindMapData.nodes || !Array.isArray(mindMapData.nodes)) {
                throw new Error('Invalid nodes array')
            }
            if (!mindMapData.edges || !Array.isArray(mindMapData.edges)) {
                mindMapData.edges = []
            }

            // Ensure all nodes have required fields
            mindMapData.nodes = mindMapData.nodes.map((node, index) => ({
                id: node.id || String(index + 1),
                label: node.label || 'Unknown',
                type: node.type || (index === 0 ? 'root' : 'topic'),
                description: node.description,
            }))

            console.log(`✅ Generated mind map with ${mindMapData.nodes.length} nodes and ${mindMapData.edges.length} edges`)
            return mindMapData
        }

        throw new Error('No valid JSON found in response')
    } catch (error) {
        console.error('❌ Mind map generation failed:', error)

        // Return a basic fallback structure
        return {
            nodes: [
                { id: '1', label: pdfName, type: 'root' },
                { id: '2', label: 'Content Analysis', type: 'topic' },
                { id: '3', label: 'Key Topics', type: 'topic' },
            ],
            edges: [
                { source: '1', target: '2' },
                { source: '1', target: '3' },
            ],
        }
    }
}
