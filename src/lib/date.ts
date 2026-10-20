const DAY = 24 * 60 * 60 * 1000

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function parseDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function daysTogether(anniversary: string, today = new Date()) {
  return Math.round((startOfDay(today).getTime() - parseDate(anniversary).getTime()) / DAY) + 1
}

export function nextMilestones(anniversary: string, today = new Date()) {
  const start = parseDate(anniversary)
  const now = startOfDay(today)
  const days = daysTogether(anniversary, today)

  const next100 = Math.ceil((days + 1) / 100) * 100
  const daysTo100 = next100 - days

  let years = now.getFullYear() - start.getFullYear()
  let nextAnniv = new Date(start.getFullYear() + years, start.getMonth(), start.getDate())
  if (nextAnniv.getTime() <= now.getTime()) {
    years += 1
    nextAnniv = new Date(start.getFullYear() + years, start.getMonth(), start.getDate())
  }
  const daysToAnniv = Math.round((nextAnniv.getTime() - now.getTime()) / DAY)

  return { next100, daysTo100, years, daysToAnniv }
}

export function formatDate(iso: string | null) {
  if (!iso) return ''
  const d = parseDate(iso)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}
