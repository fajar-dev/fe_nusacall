export interface CallHoursDay {
  day_of_week: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
  open_time: string
  close_time: string
}

export interface CallHours {
  status: 'ENABLED' | 'DISABLED'
  timezone_id: string
  weekly_operating_hours: CallHoursDay[]
  holiday_schedule?: Array<{ date: string, start_time: string, end_time: string }>
}

export interface Account {
  id: number
  appId: string | null
  phoneNumberId: string
  displayPhoneNumber: string
  label: string
  isTestNumber: boolean
  callingEnabled: boolean
  callIconVisibility: 'DEFAULT' | 'DISABLE_ALL'
  color: string
  callHours: CallHours | null
  answerTimeoutSeconds: number
  lastSyncedAt: string | null
}

export interface HealthStatus {
  id: string
  health_status?: {
    can_send_message?: string
    entities?: Array<{ entity_type: string, id: string, can_send_message: string, errors?: Array<{ error_code: number, error_description: string }> }>
  }
}
