import React, { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface PdfViewerProps {
  url: string
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pdfDocRef = useRef<any>(null)

  useEffect(() => {
    const loadPdf = async () => {
      setLoading(true)
      setError(null)
      try {
        console.log('PDF Viewer - Loading URL:', url)

        // Ensure URL is absolute
        let fetchUrl = url
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          // If relative URL, prepend backend base URL
          const apiBaseUrl = import.meta.env.VITE_API_URL || ''
          fetchUrl = apiBaseUrl + url
          console.log('PDF Viewer - Converted to absolute URL:', fetchUrl)
        }

        const response = await fetch(fetchUrl, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/pdf',
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        const pdf = await loadingTask.promise
        pdfDocRef.current = pdf
        setNumPages(pdf.numPages)
        renderPage(1, pdf)
      } catch (error) {
        console.error('Error loading PDF:', error)
        setError('Failed to load PDF. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadPdf()
  }, [url])

  const renderPage = async (pageNumber: number, pdf?: any) => {
    const pdfDoc = pdf || pdfDocRef.current
    if (!pdfDoc || !canvasRef.current) return

    try {
      const page = await pdfDoc.getPage(pageNumber)
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      canvas.height = viewport.height
      canvas.width = viewport.width

      const renderContext = {
        canvasContext: context!,
        viewport: viewport,
      }

      await page.render(renderContext).promise
    } catch (error) {
      console.error('Error rendering page:', error)
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page)
      renderPage(page)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-100 border-b px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-white border rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm">
          Page {currentPage} of {numPages}
        </span>
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === numPages}
          className="px-3 py-1 bg-white border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-gray-200 p-4">
        <div className="flex justify-center">
          <canvas ref={canvasRef} className="shadow-lg bg-white" />
        </div>
      </div>
    </div>
  )
}
