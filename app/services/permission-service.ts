import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import type { ApiResponse } from '../types/api'
import type { PermissionCheckResult } from '../types/permission'

class PermissionService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async check(phoneNumberId: string, waId: string): Promise<ApiResponse<PermissionCheckResult>> {
    try {
      const params = new URLSearchParams({ phoneNumberId, waId })
      const response = await apiService.client.get<ApiResponse<PermissionCheckResult>>(`/permission?${params.toString()}`, this.authHeaders)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  /** Sends the VOICE_CALL_REQUEST template — the customer sees this as a real WhatsApp message. */
  async request(phoneNumberId: string, waId: string): Promise<ApiResponse<null>> {
    try {
      const response = await apiService.client.post<ApiResponse<null>>('/permission/request', { phoneNumberId, waId }, this.authHeaders)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }
}

export const permissionService = new PermissionService()
