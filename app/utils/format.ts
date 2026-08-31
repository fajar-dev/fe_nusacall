/**
 * Menambahkan tanda plus untuk ditampilkan. Backend menyimpan nomor tanpa plus
 * mengikuti format Meta, jadi tanda ini hanya dipakai di antarmuka.
 */
export function formatPhoneNumber(value?: string | null): string {
  const digits = (value ?? '').replace(/\D/g, '')
  return digits ? `+${digits}` : ''
}

const relativeFormatter = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })
const clockFormatter = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

export function formatRelative(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / 60000)
  if (Math.abs(diffMinutes) < 60) return relativeFormatter.format(diffMinutes, 'minute')
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return relativeFormatter.format(diffHours, 'hour')
  return relativeFormatter.format(Math.round(diffHours / 24), 'day')
}

export function formatClockTime(iso: string | null): string {
  if (!iso) return '—'
  return clockFormatter.format(new Date(iso))
}

export function formatCallDate(dateStr: string | null | undefined, yesterdayLabel: string): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  if (date >= todayStart) {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  if (date >= yesterdayStart) return yesterdayLabel

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}
