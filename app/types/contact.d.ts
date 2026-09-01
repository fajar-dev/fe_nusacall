import type { Timezone } from '~/enums/timezone'

export interface Contact {
  id: number
  phoneNumber: string
  name: string | null
  timeZone: Timezone
  branches: {
    id: number
    name: string
    code: string
  }[]
  createdAt: string
  updatedAt: string
}

export interface ContactPayload {
  phoneNumber?: string
  name?: string | null
  timeZone?: Timezone
  branchIds?: number[]
}
