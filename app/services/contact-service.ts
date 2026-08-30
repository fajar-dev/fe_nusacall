import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import { buildPagedQuery } from '~/utils/query'
import type { ApiResponse } from '../types/api'
import type { Contact } from '../types/contact'

export interface ContactListParams {
  page?: number
  limit?: number
  q?: string
}

class ContactService {
  async getAll(params: ContactListParams = {}): Promise<ApiResponse<Contact[]>> {
    try {
      const query = buildPagedQuery(params)

      const response = await apiService.client.get<ApiResponse<Contact[]>>(`/contact?${query}`)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }
}

export const contactService = new ContactService()
