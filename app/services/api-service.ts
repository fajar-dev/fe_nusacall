import axios from 'axios'
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, SIGN_IN_PATH, USER_KEY } from '~/constants/storage'

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean }

type RefreshHandler = () => Promise<string | null>

class ApiService {
  private instance: AxiosInstance | null = null
  private refreshHandler: RefreshHandler | null = null

  setRefreshHandler(handler: RefreshHandler) {
    this.refreshHandler = handler
  }

  get client(): AxiosInstance {
    if (!this.instance) this.instance = this.createInstance()
    return this.instance
  }

  private createInstance(): AxiosInstance {
    const config = useRuntimeConfig()

    const instance = axios.create({
      baseURL: config.public.apiUrl as string,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    instance.interceptors.request.use((request) => {
      const token = useAuth().state.token
      if (token) request.headers.Authorization = `Bearer ${token}`
      return request
    })

    instance.interceptors.response.use(
      response => response,
      (error: AxiosError) => this.handleResponseError(instance, error)
    )

    return instance
  }

  private async handleResponseError(instance: AxiosInstance, error: AxiosError) {
    const status = error.response?.status
    const request = error.config as RetriableRequest | undefined

    if (status === 403 && typeof window !== 'undefined') {
      navigateTo('/')
    }

    if (status !== 401 || !request || request._retry) {
      return Promise.reject(error)
    }

    if (typeof window !== 'undefined' && window.location.pathname === SIGN_IN_PATH) {
      return Promise.reject(error)
    }

    request._retry = true

    const refreshedToken = await this.tryRefreshToken()
    if (refreshedToken) {
      request.headers.Authorization = `Bearer ${refreshedToken}`
      return instance(request)
    }

    this.clearSessionAndRedirect()
    return Promise.reject(error)
  }

  private async tryRefreshToken(): Promise<string | null> {
    if (!this.refreshHandler) return null
    try {
      return await this.refreshHandler()
    } catch {
      return null
    }
  }

  private clearSessionAndRedirect() {
    if (typeof window === 'undefined') return

    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)

    const redirect = window.location.pathname + window.location.search
    navigateTo({ path: SIGN_IN_PATH, query: { redirect } })
  }
}

export const apiService = new ApiService()
