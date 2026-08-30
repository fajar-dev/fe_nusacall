import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import type { ApiResponse } from '../types/api'
import type { BranchListItem } from '../types/branch'

class BranchService {
  async getList(): Promise<ApiResponse<BranchListItem[]>> {
    try {
      const response = await apiService.client.get<ApiResponse<BranchListItem[]>>('/branch/list')
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }
}

export const branchService = new BranchService()
