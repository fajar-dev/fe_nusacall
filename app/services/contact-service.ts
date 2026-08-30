import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import { buildPagedQuery } from '~/utils/query'
import type { ApiResponse } from '../types/api'
import type { Contact, ContactPayload } from '../types/contact'
import type { SortOrder } from '~/enums/sort-order'

export interface ContactListParams {
  page?: number
  limit?: number
  q?: string
  branchId?: number
  sortBy?: string
  order?: SortOrder
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

  async getById(id: number): Promise<ApiResponse<Contact>> {
    try {
      const response = await apiService.client.get<ApiResponse<Contact>>(`/contact/${id}`)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async create(payload: ContactPayload): Promise<ApiResponse<Contact>> {
    try {
      const response = await apiService.client.post<ApiResponse<Contact>>('/contact', payload)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async update(id: number, payload: ContactPayload): Promise<ApiResponse<Contact>> {
    try {
      const response = await apiService.client.put<ApiResponse<Contact>>(`/contact/${id}`, payload)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async remove(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await apiService.client.delete<ApiResponse<null>>(`/contact/${id}`)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }
}

export const contactService = new ContactService()
