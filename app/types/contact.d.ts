export type Salutation = 'mr' | 'mrs'
export type ContactType = 'customer' | 'vendor' | 'supplier' | 'other'

export interface Contact {
  id: number
  name: string
  salutation: Salutation | null
  email: string
  phone: string
  type: ContactType
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ContactPayload {
  name: string
  salutation: Salutation | undefined
  email: string
  phone: string
  type: ContactType
  isActive: boolean
}

export interface PaginationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  from: number
  to: number
}

export interface ApiResponse<T = any> {
  success: boolean
  statusCode?: number
  message?: string
  data: T
  meta?: PaginationMeta
}
