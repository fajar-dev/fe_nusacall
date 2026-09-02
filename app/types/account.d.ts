import type { DayOfWeek } from '~/enums/day-of-week'
import type { CallHoursStatus } from '~/enums/call-hours-status'
import type { Timezone } from '~/enums/timezone'
import type { CallIconVisibility } from '~/enums/call-icon-visibility'

export interface CallHoursDay {
  day_of_week: DayOfWeek
  open_time: string
  close_time: string
}

export interface CallHours {
  status: CallHoursStatus
  timezone_id: Timezone
  weekly_operating_hours: CallHoursDay[]
  holiday_schedule?: Array<{ date: string, start_time: string, end_time: string }>
}

export interface Account {
  id: number
  appId: string | null
  businessAccountId: string
  phoneNumberId: string
  displayPhoneNumber: string
  label: string
  isOfficial: boolean
  callingEnabled: boolean
  callIconVisibility: CallIconVisibility
  permissionTemplateName: string | null
  permissionTemplateLanguage: string | null
  color: string
  callHours: CallHours | null
  lastSyncedAt: string | null
}

export interface HealthStatus {
  id: string
  health_status?: {
    can_send_message?: string
    entities?: Array<{ entity_type: string, id: string, can_send_message: string, errors?: Array<{ error_code: number, error_description: string }> }>
  }
}

export interface MessageTemplate {
  name: string
  language: string
  category: string | null
}
