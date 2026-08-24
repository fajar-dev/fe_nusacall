import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import type { AuthResponse, User } from '../types/auth'

export class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'accessToken'
  private readonly USER_KEY = 'user'

  public user = ref<User | null>(null)
  public token = ref<string | null>(null)

  constructor() {
    this.restoreSession()
    this.validateSession()
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
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      this.user.value = response.data.data
      localStorage.setItem(this.USER_KEY, JSON.stringify(this.user.value))
    } catch {
      // Token is invalid/expired — the axios interceptor in api-service
      // handles the 401 and redirect; nothing to do here.
    }
  }

  /** Never calls nusawa directly — the backend relays credentials server-side. */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiService.client.post<AuthResponse>('/auth/login', { email, password })
      this.setSession(response.data)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  /** Same relay pattern as `login` — nusawa verifies the Google ID token itself. */
  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    try {
      const response = await apiService.client.post<AuthResponse>('/auth/login/google', { idToken })
      this.setSession(response.data)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async logout() {
    if (typeof window === 'undefined') return
    const accessToken = this.token.value

    try {
      if (accessToken) {
        await apiService.client.post('/auth/logout', null, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      }
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY)
      localStorage.removeItem(this.USER_KEY)

      this.token.value = null
      this.user.value = null

      if (window.location.pathname !== '/auth/sign-in') {
        navigateTo('/auth/sign-in')
      }
    }
  }

  private setSession(response: AuthResponse) {
    if (typeof window === 'undefined') return

    const { user, accessToken } = response.data

    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(this.USER_KEY, JSON.stringify(user))

    this.token.value = accessToken
    this.user.value = user
  }
}

export const authService = new AuthService()
