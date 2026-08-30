import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import { buildPagedQuery } from '~/utils/query'
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
  async getAll(params: UserListParams = {}): Promise<ApiResponse<User[]>> {
    try {
      const query = buildPagedQuery(params)

      const response = await apiService.client.get<ApiResponse<User[]>>(`/user?${query}`)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async getMe(): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.client.get<ApiResponse<User>>('/user/me')
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async getAvailable(): Promise<ApiResponse<User[]>> {
    try {
      const response = await apiService.client.get<ApiResponse<User[]>>('/user/available')
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }
}

export const userService = new UserService()
