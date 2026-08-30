import axios, { type AxiosError } from 'axios'

interface ApiErrorResponse {
  message?: string
  errors?: Array<{ field?: string, message: string }>
}

export const extractErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ApiErrorResponse>
  return axiosError.response?.data?.message || axiosError.message || fallback
}

export const handleServiceError = (error: unknown): never => {
  const axiosError = error as AxiosError<ApiErrorResponse>
  if (axios.isCancel(error)) {
    throw error
  }

  const toast = useToast()
  const responseData = axiosError.response?.data

  const title = responseData?.message || 'Gagal'
  let message = ''

  if (axiosError.response?.status === 422 && responseData?.errors) {
    message = responseData.errors.map(err => err.message).join(', ')
  } else {
    message = responseData?.message || axiosError.message || 'Terjadi kesalahan'
    if (message === title) message = ''
  }

  toast.add({
    title: title,
    description: message,
    icon: 'i-lucide-circle-x',
    color: 'error'
  })

  throw new Error()
}
