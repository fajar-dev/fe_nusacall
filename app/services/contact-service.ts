import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import type { ApiResponse } from '../types/api'
import type { Contact } from '../types/contact'

/**
 * NusaCall owns no contact data — this calls NusaCall's /api/contact, which
 * relays to nusawa server-side. The browser never talks to nusawa directly.
 */
export class ContactService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async getAll(page = 1, perPage = 10, search = ''): Promise<ApiResponse<Contact[]>> {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(perPage), search })
      const response = await apiService.client.get<ApiResponse<Contact[]>>(
        `/contact?${params.toString()}`,
        this.authHeaders
      )
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }
}

export const contactService = new ContactService()
