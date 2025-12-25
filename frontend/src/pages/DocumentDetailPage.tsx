import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePdfs } from '@/hooks/usePdfs'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { PdfViewer } from '@/components/documents/PdfViewer'
import { MindMapView } from '@/components/documents/MindMapView'

type TabType = 'split' | 'mindmap'

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { getPdfQuery, downloadAsync, isDownloading } = usePdfs()
  const [activeTab, setActiveTab] = useState<TabType>('split')

  const { data, isLoading, error } = getPdfQuery(id!)

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Document not found</h2>
          <Link to="/documents" className="text-blue-600 hover:text-blue-500">
            ← Back to Documents
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/documents" className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">{data.pdf.name}</h1>
          </div>

          {/* Tab Buttons */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'split'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <span className="material-symbols-outlined text-lg">splitscreen</span>
              PDF & Chat
            </button>
            <button
              onClick={() => setActiveTab('mindmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'mindmap'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <span className="material-symbols-outlined text-lg">account_tree</span>
              Mind Map
            </button>
          </div>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Đang tải...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Tải xuống
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'split' && (
          <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
            <div className="h-full border rounded-lg overflow-hidden bg-white">
              <PdfViewer url={data.downloadUrl} />
            </div>
            <div className="h-full">
              <ChatPanel documentId={id!} />
            </div>
          </div>
        )}

        {activeTab === 'mindmap' && (
          <div className="h-full p-4">
            <div className="h-full border rounded-lg overflow-hidden bg-white">
              <MindMapView documentId={id!} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

