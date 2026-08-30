import axios from 'axios'
import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import { buildPagedQuery, buildQuery } from '~/utils/query'
import type { ApiResponse } from '../types/api'
import type { Call, CallStats, ArtifactAvailability } from '../types/call'
import type { SortOrder } from '~/enums/sort-order'

interface CallListParams {
  page?: number
  limit?: number
  q?: string
  status?: string[]
  direction?: string
  userId?: number
  from?: string
  to?: string
  sortBy?: string
  order?: SortOrder
}

class CallService {
  async getAll(params: CallListParams = {}): Promise<ApiResponse<Call[]>> {
    try {
      const query = buildPagedQuery(params)

      const response = await apiService.client.get<ApiResponse<Call[]>>(`/call?${query}`)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async getById(id: number): Promise<ApiResponse<Call>> {
    try {
      const response = await apiService.client.get<ApiResponse<Call>>(`/call/${id}`)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async getRecordingAvailability(id: number): Promise<ArtifactAvailability> {
    try {
      const response = await apiService.client.get<ApiResponse<{ url: string }>>(`/call/${id}/recording`)
      return { state: 'ready', url: response.data.data.url }
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined
      if (status === 410) return { state: 'expired' }
      if (status !== 404) console.error('Unexpected error fetching recording availability', error)
      return { state: 'not_ready' }
    }
  }

  async placeOutboundCall(phoneNumberId: string, waId: string, offerSdp: string): Promise<ApiResponse<{ wacid: string, answerSdp: string }>> {
    try {
      const response = await apiService.client.post<ApiResponse<{ wacid: string, answerSdp: string }>>(
        '/call/outbound', { phoneNumberId, waId, offerSdp }
      )
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }

  async getStats(params: { from?: string, to?: string } = {}): Promise<ApiResponse<CallStats>> {
    try {
      const query = buildQuery(params)
      const response = await apiService.client.get<ApiResponse<CallStats>>(`/call/stats?${query}`)
      return response.data
    } catch (error) {
      return handleServiceError(error)
    }
  }
}

export const callService = new CallService()
