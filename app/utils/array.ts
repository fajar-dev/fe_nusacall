interface Identifiable {
  id: number
}

export function upsertById<T extends Identifiable>(list: T[], item: T): void {
  const index = list.findIndex(entry => entry.id === item.id)
  if (index === -1) list.unshift(item)
  else list[index] = item
}

export function replaceById<T extends Identifiable>(list: T[], item: T): boolean {
  const index = list.findIndex(entry => entry.id === item.id)
  if (index === -1) return false
  list[index] = item
  return true
}

export function removeById<T extends Identifiable>(list: T[], id: number): boolean {
  const index = list.findIndex(entry => entry.id === id)
  if (index === -1) return false
  list.splice(index, 1)
  return true
}

export function toggleValue<T>(list: T[], value: T): void {
  const index = list.indexOf(value)
  if (index === -1) list.push(value)
  else list.splice(index, 1)
}
