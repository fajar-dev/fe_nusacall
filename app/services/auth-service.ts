import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, SIGN_IN_PATH, USER_KEY } from '~/constants/storage'
import type { AuthResponse, NusaworkQrCode, NusaworkQrStatus, User } from '../types/auth'
import type { ApiResponse } from '../types/api'

class AuthService {
  public user = ref<User | null>(null)
  public token = ref<string | null>(null)

  constructor() {
    this.restoreSession()
    this.validateSession()
    apiService.setRefreshHandler(this.refreshToken.bind(this))
  }

  private restoreSession() {
    if (typeof window === 'undefined') return

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!accessToken) return

    this.token.value = accessToken

    const userJson = localStorage.getItem(USER_KEY)
    if (!userJson) return

    try {
      this.user.value = JSON.parse(userJson)
    } catch (error) {
      console.error('Failed to parse user from local storage', error)
    }
  }

  private async validateSession() {
    if (typeof window === 'undefined' || !this.token.value) return

    try {
      const response = await apiService.client.get<ApiResponse<User>>('/auth/me')
      this.user.value = response.data.data
      localStorage.setItem(USER_KEY, JSON.stringify(this.user.value))
    } catch {
      return
    }
  }

  async refreshToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) return null

    try {
      const response = await apiService.client.post<AuthResponse>('/auth/refresh', { refreshToken })
      this.setSession(response.data)
      return response.data.data.accessToken
    } catch {
      this.logout()
      return null
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiService.client.post<AuthResponse>('/auth/login', { email, password })
      this.setSession(response.data)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async google(code: string): Promise<AuthResponse> {
    try {
      const response = await apiService.client.post<AuthResponse>('/auth/google', { code })
      this.setSession(response.data)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async logout(preserveRedirect = false) {
    if (typeof window === 'undefined') return

    try {
      if (this.token.value) {
        await apiService.client.post('/auth/logout')
      }
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      this.clearSession()
      this.redirectToSignIn(preserveRedirect)
    }
  }

  private clearSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)

    this.token.value = null
    this.user.value = null
  }

  private redirectToSignIn(preserveRedirect: boolean) {
    if (window.location.pathname === SIGN_IN_PATH) return

    if (!preserveRedirect) {
      navigateTo(SIGN_IN_PATH)
      return
    }

    const redirect = window.location.pathname + window.location.search
    navigateTo({ path: SIGN_IN_PATH, query: { redirect } })
  }

  private setSession(response: AuthResponse) {
    if (typeof window === 'undefined') return

    const { user, accessToken, refreshToken } = response.data

    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(user))

    this.token.value = accessToken
    this.user.value = user
  }

  async generateNusaworkQr(): Promise<ApiResponse<NusaworkQrCode>> {
    const response = await apiService.client.get<ApiResponse<NusaworkQrCode>>('/auth/qrcode/generate')
    return response.data
  }

  async checkNusaworkStatus(token: string): Promise<ApiResponse<NusaworkQrStatus>> {
    const response = await apiService.client.get<ApiResponse<NusaworkQrStatus>>(`/auth/qrcode/${token}/status`)
    return response.data
  }

  async nusaworkLogin(panelToken: string): Promise<AuthResponse> {
    const response = await apiService.client.post<AuthResponse>('/auth/qrcode/login', { panelToken })
    this.setSession(response.data)
    return response.data
  }
}

export const authService = new AuthService()
