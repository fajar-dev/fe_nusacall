import axios from 'axios'
import { apiService } from './api-service'
import { handleServiceError } from '../composables/error-helper'
import type { ApiResponse } from '../types/api'
import type { Call, CallStats, ArtifactAvailability, TranscriptAvailability, TranscriptDocument } from '../types/call'

export interface CallListParams {
  page?: number
  limit?: number
  q?: string
  status?: string[]
  direction?: string
  agentEmail?: string
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
      if (params.agentEmail) query.set('agentEmail', params.agentEmail)
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

  /** 404 (not requested/downloading) and 410 (Meta's 7-day window expired) are
   * routine here, not error-toast-worthy, so this skips handleServiceError. */
  async getRecordingAvailability(id: number): Promise<ArtifactAvailability> {
    try {
      const response = await apiService.client.get<ApiResponse<{ url: string }>>(`/call/${id}/recording`, this.authHeaders)
      return { state: 'ready', url: response.data.data.url }
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined
      if (status === 410) return { state: 'expired' }
      // Non-404 errors still resolve to the same quiet UI state, but get logged.
      if (status !== 404) console.error('Unexpected error fetching recording availability', error)
      return { state: 'not_ready' }
    }
  }

  async getTranscriptAvailability(id: number): Promise<TranscriptAvailability> {
    try {
      const response = await apiService.client.get<ApiResponse<TranscriptDocument>>(`/call/${id}/transcript`, this.authHeaders)
      return { state: 'ready', content: response.data.data }
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined
      if (status === 410) return { state: 'expired' }
      if (status !== 404) console.error('Unexpected error fetching transcript availability', error)
      return { state: 'not_ready' }
    }
  }

  /** Places a business-initiated call. `offerSdp` is the agent's own browser SDP offer, generated up front. */
  async placeOutboundCall(phoneNumberId: string, waId: string, offerSdp: string): Promise<ApiResponse<{ wacid: string, answerSdp: string }>> {
    try {
      const response = await apiService.client.post<ApiResponse<{ wacid: string, answerSdp: string }>>(
        '/call/outbound', { phoneNumberId, waId, offerSdp }, this.authHeaders
      )
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
