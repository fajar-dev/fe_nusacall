import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import type { ApiResponse } from '../types/agent'
import type { Call, CallStats } from '../types/call'

export interface CallListParams {
  page?: number
  limit?: number
  q?: string
  status?: string[]
  direction?: string
  agentUsername?: string
  from?: string
  to?: string
  sortBy?: string
  order?: 'ASC' | 'DESC'
}

export class CallService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async getAll(params: CallListParams = {}): Promise<ApiResponse<Call[]>> {
    try {
      const query = new URLSearchParams()
      query.set('page', String(params.page ?? 1))
      query.set('limit', String(params.limit ?? 10))
      if (params.q) query.set('q', params.q)
      if (params.status?.length) query.set('status', params.status.join(','))
      if (params.direction) query.set('direction', params.direction)
      if (params.agentUsername) query.set('agentUsername', params.agentUsername)
      if (params.from) query.set('from', params.from)
      if (params.to) query.set('to', params.to)
      if (params.sortBy) query.set('sortBy', params.sortBy)
      if (params.order) query.set('order', params.order)

      const response = await apiService.client.get<ApiResponse<Call[]>>(`/call?${query.toString()}`, this.authHeaders)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async getById(id: number): Promise<ApiResponse<Call>> {
    try {
      const response = await apiService.client.get<ApiResponse<Call>>(`/call/${id}`, this.authHeaders)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async getStats(params: { from?: string, to?: string } = {}): Promise<ApiResponse<CallStats>> {
    try {
      const query = new URLSearchParams()
      if (params.from) query.set('from', params.from)
      if (params.to) query.set('to', params.to)
      const response = await apiService.client.get<ApiResponse<CallStats>>(`/call/stats?${query.toString()}`, this.authHeaders)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }
}

export const callService = new CallService()
