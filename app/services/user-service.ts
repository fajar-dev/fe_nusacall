import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import type { ApiResponse } from '../types/api'
import type { User } from '../types/user'

class UserService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async getAll(page = 1, perPage = 10, q = ''): Promise<ApiResponse<User[]>> {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(perPage), q })
      const response = await apiService.client.get<ApiResponse<User[]>>(
        `/user?${params.toString()}`,
        this.authHeaders
      )
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async getMe(): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.client.get<ApiResponse<User>>('/user/me', this.authHeaders)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  /** Users currently online (live WebSocket connection) and free to take a call — no eligibility flag, every user can receive calls. */
  async getAvailable(): Promise<ApiResponse<User[]>> {
    try {
      const response = await apiService.client.get<ApiResponse<User[]>>('/user/available', this.authHeaders)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }
}

export const userService = new UserService()
