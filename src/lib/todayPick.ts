const PREFIX = 'memories-today-pick:'

function todayKey() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function loadTodayPickId(coupleId: string): string | null {
  try {
    const raw = localStorage.getItem(PREFIX + coupleId)
    if (!raw) return null
    const data = JSON.parse(raw) as { date?: string; id?: string }
    if (data.date !== todayKey() || !data.id) return null
    return data.id
  } catch {
    return null
  }
}

export function saveTodayPickId(coupleId: string, id: string) {
  localStorage.setItem(PREFIX + coupleId, JSON.stringify({ date: todayKey(), id }))
}

export function pickRandom<T extends { id: string }>(items: T[], exceptId?: string): T | null {
  if (items.length === 0) return null
  const pool = exceptId && items.length > 1 ? items.filter((item) => item.id !== exceptId) : items
  return pool[Math.floor(Math.random() * pool.length)] ?? null
}
