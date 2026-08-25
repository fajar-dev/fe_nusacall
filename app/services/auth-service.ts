import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import type { AuthResponse, User } from '../types/auth'
import type { ApiResponse } from "../types/api"

export class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'accessToken'
  private readonly REFRESH_TOKEN_KEY = 'refreshToken'
  private readonly USER_KEY = 'user'

  public user = ref<User | null>(null)
  public token = ref<string | null>(null)

    constructor() {
        this.restoreSession()
        this.validateSession()
        apiService.setRefreshHandler(this.refreshToken.bind(this))
    }

    private restoreSession() {
      if (typeof window === 'undefined') return
  
          const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY)
      if (accessToken) {
          this.token.value = accessToken
          const userJson = localStorage.getItem(this.USER_KEY)
          if (userJson) {
              try {
                  this.user.value = JSON.parse(userJson)
              } catch (e) {
                  console.error('Failed to parse user from local storage', e)
              }
          }
      }
    }

    private async validateSession() {
        if (typeof window === 'undefined') return
        const accessToken = this.token.value
        if (!accessToken) return

        try {
            const response = await apiService.client.get<{ success: boolean, data: User }>('/auth/me', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })
            this.user.value = response.data.data
            localStorage.setItem(this.USER_KEY, JSON.stringify(this.user.value))
        } catch (error) {
            // Validation failed, let interceptor handle it
        }
    }

    async refreshToken(): Promise<string | null> {
        if (typeof window === 'undefined') return null

            const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY)
        if (!refreshToken) return null

        try {
            const config = useRuntimeConfig()
            const response = await apiService.client.post<AuthResponse>(`${config.public.apiUrl}/auth/refresh`, {
            refreshToken
        })
        
            this.setSession(response.data)
            return response.data.data.accessToken
        } catch (error) {
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
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  async logout(preserveRedirect = false) {
        if (typeof window === 'undefined') return
            const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY)

        try {
            if (this.token.value) {
                this.token.value = accessToken  
                await apiService.client.post('/auth/logout',{
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                })
            }
        } catch (error) {
            console.error('Logout failed:', error)
        } finally {
            localStorage.removeItem(this.ACCESS_TOKEN_KEY)
            localStorage.removeItem(this.REFRESH_TOKEN_KEY)
            localStorage.removeItem(this.USER_KEY)

            this.token.value = null
            this.user.value = null

            if (window.location.pathname !== '/auth/sign-in') {
                if (preserveRedirect) {
                    const currentPath = window.location.pathname + window.location.search
                    navigateTo({ path: '/auth/sign-in', query: { redirect: currentPath } })
                } else {
                    navigateTo('/auth/sign-in')
                }
            }
        }
    }

  private setSession(response: AuthResponse) {
    if (typeof window === 'undefined') return

    const { user, accessToken, refreshToken } = response.data

    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken)
    localStorage.setItem(this.USER_KEY, JSON.stringify(user))

    this.token.value = accessToken
    this.user.value = user
  }

    private getBaseUrl(): string {
        const config = useRuntimeConfig()
        return config.public.apiUrl as string
    }

    async generateNusaworkQr(): Promise<ApiResponse<{ token: string; qrCode: string; timeoutMinutes: number; expired: string }>> {
        const response = await apiService.client.get<ApiResponse<{ token: string; qrCode: string; timeoutMinutes: number; expired: string }>>(`${this.getBaseUrl()}/auth/qrcode/generate`)
        return response.data
    }

    async checkNusaworkStatus(token: string): Promise<ApiResponse<{ status: 'waiting' | 'confirmation' | 'success'; panelToken?: string; profile?: any; message?: string }>> {
        const response = await apiService.client.get<ApiResponse<{ status: 'waiting' | 'confirmation' | 'success'; panelToken?: string; profile?: any; message?: string }>>(`${this.getBaseUrl()}/auth/qrcode/${token}/status`)
        return response.data
    }

    async nusaworkLogin(panelToken: string): Promise<AuthResponse> {
        const response = await apiService.client.post<AuthResponse>(`${this.getBaseUrl()}/auth/qrcode/login`, { panelToken })
        this.setSession(response.data)
        return response.data
    }
}

export const authService = new AuthService()
