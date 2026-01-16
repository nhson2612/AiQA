import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pdfsApi } from '@/api/pdfs'
import { getErrorMessage } from '@/api/axios'
import { useSetRecoilState } from 'recoil'
import { documentsAtom, documentsErrorAtom } from '@/atoms/documentsAtom'
import { useEffect } from 'react'

export const usePdf = (id: string) => {
  return useQuery({
    queryKey: ['pdf', id],
    queryFn: () => pdfsApi.get(id),
    enabled: !!id,
  })
}

export const usePdfs = () => {
  const queryClient = useQueryClient()
  const setDocuments = useSetRecoilState(documentsAtom)
  const setError = useSetRecoilState(documentsErrorAtom)

  const {
    data: pdfs = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['pdfs'],
    queryFn: pdfsApi.list,
  })

  // Update Recoil state when data changes
  useEffect(() => {
    if (pdfs) {
      setDocuments(pdfs)
    }
  }, [pdfs, setDocuments])

  // Update error state when query error occurs
  useEffect(() => {
    if (queryError) {
      setError(getErrorMessage(queryError))
    }
  }, [queryError, setError])

  const uploadMutation = useMutation({
    mutationFn: pdfsApi.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdfs'] })
    },
    onError: (error) => {
      setError(getErrorMessage(error))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: pdfsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdfs'] })
    },
    onError: (error) => {
      setError(getErrorMessage(error))
    },
  })

  const downloadMutation = useMutation({
    mutationFn: pdfsApi.download,
    onError: (error) => {
      setError(getErrorMessage(error))
    },
  })

  return {
    pdfs,
    isLoading,
    upload: uploadMutation.mutate,
    uploadAsync: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    delete: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
    download: downloadMutation.mutate,
    downloadAsync: downloadMutation.mutateAsync,
    isDownloading: downloadMutation.isPending,
    downloadError: downloadMutation.error,
  }
}
