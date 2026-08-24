import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import type { Agent, ApiResponse } from '../types/agent'

export class AgentService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async getAll(page = 1, perPage = 10, q = ''): Promise<ApiResponse<Agent[]>> {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(perPage), q })
      const response = await apiService.client.get<ApiResponse<Agent[]>>(
        `/agent?${params.toString()}`,
        this.authHeaders
      )
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async updateCanReceiveCalls(username: string, canReceiveCalls: boolean): Promise<ApiResponse<Agent>> {
    try {
      const response = await apiService.client.put<ApiResponse<Agent>>(
        `/agent/${encodeURIComponent(username)}`,
        { canReceiveCalls },
        this.authHeaders
      )
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }
}

export const agentService = new AgentService()
