export function showToast(type: 'success' | 'error', title: string): void {
  useToast().add({
    title,
    icon: type === 'success' ? 'i-lucide-circle-check' : 'i-lucide-circle-x'
  })
}
