import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor to handle absolute URLs
api.interceptors.request.use((config) => {
  // If URL is absolute (starts with http/https), don't prepend baseURL
  if (config.url && (config.url.startsWith('http://') || config.url.startsWith('https://'))) {
    config.baseURL = ''
  }
  return config
})

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unknown error occurred'
}

export default api
