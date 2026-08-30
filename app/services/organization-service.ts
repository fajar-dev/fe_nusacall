import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import type { ApiResponse } from '../types/api'
import type { OrganizationListItem } from '../types/organization'

class OrganizationService {
  async getList(): Promise<ApiResponse<OrganizationListItem[]>> {
    try {
      const response = await apiService.client.get<ApiResponse<OrganizationListItem[]>>('/organization/list')
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }
}

export const organizationService = new OrganizationService()
