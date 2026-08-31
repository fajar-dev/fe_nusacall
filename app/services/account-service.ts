import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import { buildPagedQuery } from '~/utils/query'
import type { ApiResponse } from '../types/api'
import type { Account, CallHours, HealthStatus } from '../types/account'
import type { CallIconVisibility } from '~/enums/call-icon-visibility'

export interface UpdateAccountPayload {
  label?: string
  callingEnabled?: boolean
  callIconVisibility?: CallIconVisibility
  color?: string
  callHours?: CallHours | null
}

class AccountService {
  async getAll(page = 1, limit = 50): Promise<ApiResponse<Account[]>> {
    try {
      const query = buildPagedQuery({ page, limit })
      const response = await apiService.client.get<ApiResponse<Account[]>>(`/account?${query}`)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async update(id: number, payload: UpdateAccountPayload): Promise<ApiResponse<Account>> {
    try {
      const response = await apiService.client.put<ApiResponse<Account>>(`/account/${id}`, payload)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async sync(id: number): Promise<ApiResponse<Account>> {
    try {
      const response = await apiService.client.post<ApiResponse<Account>>(`/account/${id}/sync`, null)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async getHealth(id: number): Promise<ApiResponse<HealthStatus>> {
    try {
      const response = await apiService.client.get<ApiResponse<HealthStatus>>(`/account/${id}/health`)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }
}

export const accountService = new AccountService()
