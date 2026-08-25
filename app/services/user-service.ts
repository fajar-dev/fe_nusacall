import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import type { ApiResponse } from '../types/api'
import type { User } from '../types/user'

export interface UserListParams {
  page?: number
  limit?: number
  q?: string
  organizationId?: number
  sortBy?: string
  order?: 'ASC' | 'DESC'
}

class UserService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async getAll(params: UserListParams = {}): Promise<ApiResponse<User[]>> {
    try {
      const query = new URLSearchParams()
      query.set('page', String(params.page ?? 1))
      query.set('limit', String(params.limit ?? 10))
      if (params.q) query.set('q', params.q)
      if (params.organizationId) query.set('organizationId', String(params.organizationId))
      if (params.sortBy) query.set('sortBy', params.sortBy)
      if (params.order) query.set('order', params.order)

      const response = await apiService.client.get<ApiResponse<User[]>>(`/user?${query.toString()}`, this.authHeaders)
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
