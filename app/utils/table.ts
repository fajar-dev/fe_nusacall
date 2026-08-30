import { h } from 'vue'

export type StatusTone = 'success' | 'warning' | 'error'

const TONE_CLASS: Record<StatusTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error'
}

export function statusDot(active: boolean, label: string, tone?: StatusTone) {
  return h('span', { class: 'inline-flex items-center gap-1.5 text-highlighted w-fit' }, [
    h('span', { class: `size-3 rounded-full ${TONE_CLASS[tone ?? (active ? 'success' : 'error')]}` }),
    label
  ])
}
