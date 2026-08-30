import type { Timezone } from '~/enums/timezone'

export interface Contact {
  id: number
  phoneNumber: string
  name: string | null
  timeZone: Timezone
  branch: {
    id: number
    name: string
    code: string
  } | null
  createdAt: string
  updatedAt: string
}

export interface ContactPayload {
  phoneNumber?: string
  name?: string | null
  timeZone?: Timezone
  branchId?: number | null
}
