import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import { buildQuery } from '~/utils/query'
import type { ApiResponse } from '../types/api'
import type { PermissionCheckResult } from '../types/permission'

class PermissionService {
  async check(phoneNumberId: string, contactId: number): Promise<ApiResponse<PermissionCheckResult>> {
    try {
      const query = buildQuery({ phoneNumberId, contactId })
      const response = await apiService.client.get<ApiResponse<PermissionCheckResult>>(`/permission?${query}`)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async request(phoneNumberId: string, contactId: number): Promise<ApiResponse<null>> {
    try {
      const response = await apiService.client.post<ApiResponse<null>>('/permission/request', { phoneNumberId, contactId })
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }
}

export const permissionService = new PermissionService()
