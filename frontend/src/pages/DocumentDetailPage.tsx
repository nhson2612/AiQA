import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePdfs, usePdf } from '@/hooks/usePdfs'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { PdfViewer } from '@/components/documents/PdfViewer'
import { MindMapView } from '@/components/documents/MindMapView'
import { ChatHeader } from '@/components/common/ChatHeader'

type ViewMode = 'chat' | 'mindmap'

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { downloadAsync, isDownloading } = usePdfs()
  const [viewMode, setViewMode] = useState<ViewMode>('chat')

  const { data, isLoading, error } = usePdf(id!)

  const handleDownload = async () => {
    if (!id) return
    try {
      await downloadAsync(id)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Document not found</h2>
          <Link to="/documents" className="text-primary hover:text-primary/80 font-medium">
            ← Back to Documents
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Chat-specific Header */}
      <ChatHeader
        documentName={data.pdf.name}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onDownload={handleDownload}
        isDownloading={isDownloading}
      />

      {/* Main Workspace */}
      <main className="flex flex-1 overflow-hidden">
        {viewMode === 'chat' ? (
          <>
            {/* Left Pane: PDF Viewer */}
            <section className="w-1/2 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-[#1a0d0a] overflow-y-auto">
              <PdfViewer url={data.downloadUrl} />
            </section>

            {/* Right Pane: AI Chat Interface */}
            <section className="w-1/2 flex flex-col bg-white dark:bg-[#1a0d0a] overflow-hidden">
              <ChatPanel documentId={id!} />
            </section>
          </>
        ) : (
          /* Full Width Mind Map View */
          <section className="w-full flex flex-col bg-white dark:bg-[#1a0d0a] overflow-y-auto">
            <MindMapView documentId={id!} />
          </section>
        )}
      </main>
    </div>
  )
}
