import { h } from 'vue'

export function statusDot(active: boolean, label: string) {
  return h('span', { class: 'inline-flex items-center gap-1.5 text-highlighted w-fit' }, [
    h('span', { class: `size-3 rounded-full ${active ? 'bg-success' : 'bg-error'}` }),
    label
  ])
}
