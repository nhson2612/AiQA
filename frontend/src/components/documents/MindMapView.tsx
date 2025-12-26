import React, { useEffect, useState, useCallback, useMemo } from 'react'
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    ConnectionLineType,
    MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'

interface MindMapNode {
    id: string
    label: string
    description?: string
    type: 'root' | 'topic' | 'subtopic'
}

interface MindMapEdge {
    source: string
    target: string
    label?: string
}

interface MindMapData {
    nodes: MindMapNode[]
    edges: MindMapEdge[]
}

interface MindMapViewProps {
    documentId: string
}

// Custom node styles based on type
const getNodeStyle = (type: MindMapNode['type']) => {
    switch (type) {
        case 'root':
            return {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '16px',
                boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
                border: 'none',
            }
        case 'topic':
            return {
                background: 'white',
                color: '#1e293b',
                padding: '12px 20px',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '2px solid #e2e8f0',
            }
        case 'subtopic':
            return {
                background: '#f1f5f9',
                color: '#475569',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '500',
                fontSize: '13px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0',
            }
        default:
            return {}
    }
}

// Layout algorithm: hierarchical tree layout
const layoutNodes = (data: MindMapData): Node[] => {
    const nodeMap = new Map<string, MindMapNode>()
    data.nodes.forEach((n) => nodeMap.set(n.id, n))

    // Build adjacency list
    const children = new Map<string, string[]>()
    data.edges.forEach((e) => {
        if (!children.has(e.source)) children.set(e.source, [])
        children.get(e.source)!.push(e.target)
    })

    // Find root (node with no incoming edges)
    const hasIncoming = new Set(data.edges.map((e) => e.target))
    const roots = data.nodes.filter((n) => !hasIncoming.has(n.id))
    const rootId = roots.length > 0 ? roots[0].id : data.nodes[0]?.id

    const positions = new Map<string, { x: number; y: number }>()
    const horizontalSpacing = 250
    const verticalSpacing = 100

    // BFS to assign positions
    let currentY = 0
    const queue: { id: string; level: number }[] = [{ id: rootId, level: 0 }]
    const visited = new Set<string>()
    const levels = new Map<number, string[]>()

    while (queue.length > 0) {
        const { id, level } = queue.shift()!
        if (visited.has(id)) continue
        visited.add(id)

        if (!levels.has(level)) levels.set(level, [])
        levels.get(level)!.push(id)

        const nodeChildren = children.get(id) || []
        nodeChildren.forEach((childId) => {
            if (!visited.has(childId)) {
                queue.push({ id: childId, level: level + 1 })
            }
        })
    }

    // Assign positions level by level
    levels.forEach((nodeIds, level) => {
        const startY = -(nodeIds.length - 1) * verticalSpacing / 2
        nodeIds.forEach((id, index) => {
            positions.set(id, {
                x: level * horizontalSpacing,
                y: startY + index * verticalSpacing,
            })
        })
    })

    return data.nodes.map((n) => {
        const pos = positions.get(n.id) || { x: 0, y: 0 }
        return {
            id: n.id,
            data: { label: n.label },
            position: pos,
            style: getNodeStyle(n.type),
        }
    })
}

const layoutEdges = (data: MindMapData): Edge[] => {
    return data.edges.map((e, i) => ({
        id: `e${i}`,
        source: e.source,
        target: e.target,
        label: e.label,
        type: 'smoothstep',
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15 },
        style: { stroke: '#94a3b8', strokeWidth: 2 },
        labelStyle: { fill: '#64748b', fontSize: 12 },
    }))
}

export const MindMapView: React.FC<MindMapViewProps> = ({ documentId }) => {
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])

    useEffect(() => {
        const fetchMindMap = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const apiBaseUrl = import.meta.env.VITE_API_URL || ''
                const response = await fetch(`${apiBaseUrl}/api/pdfs/${documentId}/mindmap`, {
                    credentials: 'include',
                })

                if (!response.ok) {
                    throw new Error('Failed to generate mind map')
                }

                const data: MindMapData = await response.json()
                const newNodes = layoutNodes(data)
                const newEdges = layoutEdges(data)

                setNodes(newNodes)
                setEdges(newEdges)
            } catch (err) {
                console.error('Mind map fetch error:', err)
                setError(err instanceof Error ? err.message : 'An error occurred')
            } finally {
                setIsLoading(false)
            }
        }

        fetchMindMap()
    }, [documentId, setNodes, setEdges])

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Đang tạo sơ đồ tư duy...</p>
                <p className="text-gray-400 text-sm mt-1">AI đang phân tích tài liệu của bạn</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50">
                <div className="size-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-3xl text-red-500">error</span>
                </div>
                <p className="text-gray-900 font-semibold mb-2">Không thể tạo sơ đồ tư duy</p>
                <p className="text-gray-500 text-sm">{error}</p>
            </div>
        )
    }

    return (
        <div className="h-full w-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.5}
                maxZoom={2}
            >
                <Background color="#e2e8f0" gap={16} />
                <Controls />
            </ReactFlow>
        </div>
    )
}
