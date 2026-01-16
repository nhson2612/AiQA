import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePdfs } from '@/hooks/usePdfs'
import { Toast } from '@/components/common/Toast'

type TabType = 'all' | 'pdfs' | 'recent' | 'archived'

export const DocumentsPage: React.FC = () => {
  const { pdfs, isLoading, uploadAsync, isUploading, deleteAsync } = usePdfs()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
  } | null>(null)
  const navigate = useNavigate()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setToast({ message: 'Please upload a PDF file', type: 'error' })
      return
    }

    try {
      const pdf = await uploadAsync(file)
      setToast({ message: `Document "${pdf.name}" uploaded successfully!`, type: 'success' })
      navigate(`/documents/${pdf.id}`)
    } catch (err: any) {
      setToast({ message: 'Upload failed. Please try again.', type: 'error' })
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      await deleteAsync(id)
      setToast({ message: 'Document deleted successfully', type: 'success' })
    } catch (err) {
      setToast({ message: 'Failed to delete document', type: 'error' })
    }
  }

  const formatFileSize = (bytes: number): string => {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const filteredPdfs = React.useMemo(() => {
    if (activeTab === 'all' || activeTab === 'pdfs') return pdfs
    if (activeTab === 'recent') {
      return [...pdfs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
    }
    return pdfs
  }, [pdfs, activeTab])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden technical-grid">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-10 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-6">
          <Link to="/" className="text-[#a15645] dark:text-[#d1b1aa] text-sm font-medium hover:text-primary transition-colors">
            Home
          </Link>
          <span className="material-symbols-outlined text-sm text-[#a15645] opacity-50">chevron_right</span>
          <span className="text-[#1d0f0c] dark:text-[#fcf9f8] text-sm font-medium">Document Library</span>
        </div>

        {/* Page Heading & Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-[#ead2cd] dark:border-[#4a2b24] pb-0">
          <div className="flex flex-col gap-1 pb-4">
            <h1 className="text-[#1d0f0c] dark:text-[#fcf9f8] text-4xl font-black tracking-tight">
              Document Library
            </h1>
            <p className="text-[#a15645] dark:text-[#d1b1aa] text-sm">
              Index and manage your technical knowledge base.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex flex-col items-center justify-center border-b-[3px] pb-4 pt-2 transition-colors ${activeTab === 'all'
                ? 'border-primary text-[#1d0f0c] dark:text-[#fcf9f8]'
                : 'border-transparent text-[#a15645] dark:text-[#d1b1aa] hover:text-primary'
                }`}
            >
              <p className="text-sm font-bold tracking-tight">All Files</p>
            </button>
            <button
              onClick={() => setActiveTab('pdfs')}
              className={`flex flex-col items-center justify-center border-b-[3px] pb-4 pt-2 transition-colors ${activeTab === 'pdfs'
                ? 'border-primary text-[#1d0f0c] dark:text-[#fcf9f8]'
                : 'border-transparent text-[#a15645] dark:text-[#d1b1aa] hover:text-primary'
                }`}
            >
              <p className="text-sm font-bold tracking-tight">PDFs</p>
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex flex-col items-center justify-center border-b-[3px] pb-4 pt-2 transition-colors ${activeTab === 'recent'
                ? 'border-primary text-[#1d0f0c] dark:text-[#fcf9f8]'
                : 'border-transparent text-[#a15645] dark:text-[#d1b1aa] hover:text-primary'
                }`}
            >
              <p className="text-sm font-bold tracking-tight">Recent</p>
            </button>
          </div>
        </div>

        {/* Document Grid */}
        {filteredPdfs.length === 0 ? (
          <div className="text-center py-20">
            <div className="size-20 mx-auto mb-6 flex items-center justify-center bg-primary/5 text-primary rounded-lg">
              <span className="material-symbols-outlined text-5xl">folder_open</span>
            </div>
            <h3 className="text-xl font-bold text-[#1d0f0c] dark:text-[#fcf9f8] mb-2">No documents yet</h3>
            <p className="text-[#a15645] dark:text-[#d1b1aa] mb-6">Upload your first PDF to get started</p>
            <label htmlFor="file-upload-empty" className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold text-sm rounded hover:bg-primary/90 transition-colors">
              <span className="material-symbols-outlined">upload_file</span>
              Upload Document
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload-empty"
              disabled={isUploading}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {filteredPdfs.map((pdf) => (
              <div
                key={pdf.id}
                className="group flex flex-col bg-white dark:bg-[#2d1a16] border border-[#ead2cd] dark:border-[#4a2b24] rounded-sm transition-all duration-150 hover:border-primary hover:shadow-xl hover:shadow-primary/5"
              >
                {/* Card Content */}
                <Link
                  to={`/documents/${pdf.id}`}
                  className="p-6 flex flex-col items-center text-center border-b border-dashed border-[#ead2cd] dark:border-[#4a2b24]"
                >
                  <div className="size-16 mb-4 flex items-center justify-center bg-primary/5 text-primary rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <span className="material-symbols-outlined text-4xl">picture_as_pdf</span>
                  </div>
                  <h3 className="text-[#1d0f0c] dark:text-[#fcf9f8] text-base font-bold truncate w-full px-2">
                    {pdf.name}
                  </h3>
                  <div className="mt-2 flex flex-col gap-1">
                    <p className="text-[#a15645] dark:text-[#d1b1aa] text-xs font-normal">
                      Uploaded: {formatDate(pdf.createdAt)}
                    </p>
                    <p className="text-primary text-[10px] font-bold tracking-widest uppercase bg-primary/10 px-2 py-0.5 rounded-full inline-block mx-auto">
                      {formatFileSize(pdf.size || 0)}
                    </p>
                  </div>
                </Link>

                {/* Card Actions */}
                <div className="flex divide-x divide-[#ead2cd] dark:divide-[#4a2b24]">
                  <Link
                    to={`/documents/${pdf.id}`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-[#1d0f0c] dark:text-[#fcf9f8] hover:bg-background-light dark:hover:bg-primary/10 transition-colors uppercase tracking-wider"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(pdf.id, pdf.name)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors uppercase tracking-wider"
                  >
                    <span className="material-symbols-outlined text-sm">delete_sweep</span>
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {/* Add New Placeholder */}
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center border-2 border-dashed border-[#ead2cd] dark:border-[#4a2b24] rounded-sm p-10 cursor-pointer hover:border-primary group transition-colors"
            >
              <div className="size-14 rounded-full border border-[#ead2cd] dark:border-[#4a2b24] group-hover:border-primary flex items-center justify-center mb-4 transition-colors">
                <span className="material-symbols-outlined text-[#a15645] dark:text-[#d1b1aa] group-hover:text-primary">
                  add
                </span>
              </div>
              <p className="text-[#a15645] dark:text-[#d1b1aa] text-sm font-bold group-hover:text-primary uppercase tracking-widest">
                {isUploading ? 'Uploading...' : 'Add New Document'}
              </p>
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
          </div>
        )}
      </main>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}

      {/* Technical grid background style */}
      <style>{`
        .technical-grid {
          background-image: radial-gradient(#ead2cd 0.5px, transparent 0.5px);
          background-size: 24px 24px;
        }
        .dark .technical-grid {
          background-image: radial-gradient(#4a2b24 0.5px, transparent 0.5px);
        }
      `}</style>
    </div>
  )
}
