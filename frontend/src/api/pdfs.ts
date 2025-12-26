import api from './axios'
import { Pdf } from '@/types'

export const pdfsApi = {
  list: async (): Promise<Pdf[]> => {
    const { data } = await api.get<Pdf[]>('/pdfs')
    return data
  },

  upload: async (file: File): Promise<Pdf> => {
    const formData = new FormData()
    formData.append('file', file)

    const { data } = await api.post<Pdf>('/pdfs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },

  get: async (id: string): Promise<{ pdf: Pdf; downloadUrl: string }> => {
    const { data } = await api.get(`/pdfs/${id}`)
    return data
  },

  download: async (id: string): Promise<void> => {
    const response = await api.get(`/pdfs/${id}/download`, {
      responseType: 'blob',
    })

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition']
    let filename = `document-${id}.pdf`
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '')
      }
    }

    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/pdfs/${id}`)
  },

  getDownloadUrl: (id: string): string => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || ''
    return `${apiBaseUrl}/api/pdfs/${id}/download`
  },
}
