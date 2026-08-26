import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import type { ApiResponse } from '../types/api'
import type { PhoneNumber, CallHours, HealthStatus } from '../types/phone-number'

export interface UpdatePhoneNumberPayload {
  label?: string
  callingEnabled?: boolean
  callIconVisibility?: 'DEFAULT' | 'DISABLE_ALL'
  color?: string
  answerTimeoutSeconds?: number
  callHours?: CallHours | null
}

class PhoneNumberService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async getAll(page = 1, limit = 50): Promise<ApiResponse<PhoneNumber[]>> {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      const response = await apiService.client.get<ApiResponse<PhoneNumber[]>>(`/phone-number?${params.toString()}`, this.authHeaders)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async update(id: number, payload: UpdatePhoneNumberPayload): Promise<ApiResponse<PhoneNumber>> {
    try {
      const response = await apiService.client.put<ApiResponse<PhoneNumber>>(`/phone-number/${id}`, payload, this.authHeaders)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async sync(id: number): Promise<ApiResponse<PhoneNumber>> {
    try {
      const response = await apiService.client.post<ApiResponse<PhoneNumber>>(`/phone-number/${id}/sync`, null, this.authHeaders)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async getHealth(id: number): Promise<ApiResponse<HealthStatus>> {
    try {
      const response = await apiService.client.get<ApiResponse<HealthStatus>>(`/phone-number/${id}/health`, this.authHeaders)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }
}

export const phoneNumberService = new PhoneNumberService()
