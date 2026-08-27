import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import type { ApiResponse } from '../types/api'
import type { Contact } from '../types/contact'

export interface ContactListParams {
  page?: number
  limit?: number
  q?: string
}

class ContactService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async getAll(params: ContactListParams = {}): Promise<ApiResponse<Contact[]>> {
    try {
      const query = new URLSearchParams()
      query.set('page', String(params.page ?? 1))
      query.set('limit', String(params.limit ?? 10))
      if (params.q) query.set('q', params.q)

      const response = await apiService.client.get<ApiResponse<Contact[]>>(`/contact?${query.toString()}`, this.authHeaders)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }
}

export const contactService = new ContactService()
