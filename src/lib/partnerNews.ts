import type { Member, Place } from '../types'

function seenKey(coupleId: string, userId: string) {
  return `memories-seen:${coupleId}:${userId}`
}

export function readSeen(coupleId: string, userId: string) {
  try {
    return localStorage.getItem(seenKey(coupleId, userId))
  } catch {
    return null
  }
}

export function markSeen(coupleId: string, userId: string, at = new Date().toISOString()) {
  try {
    localStorage.setItem(seenKey(coupleId, userId), at)
  } catch {
    /* プライベートモードでは次回も案内を出す */
  }
}

export function partnerAdditions(places: Place[], userId: string, seenAt: string) {
  const seenTime = Date.parse(seenAt)
  if (Number.isNaN(seenTime)) return []
  return places.filter(
    (place) => place.created_by && place.created_by !== userId && Date.parse(place.created_at) > seenTime,
  )
}

export function additionMessage(added: Place[], members: Member[]) {
  const names = new Map(members.map((member) => [member.user_id, member.display_name?.trim() || '']))
  const byAuthor = new Map<string, number>()
  for (const place of added) {
    const id = place.created_by ?? ''
    byAuthor.set(id, (byAuthor.get(id) ?? 0) + 1)
  }
  const parts = [...byAuthor.entries()].map(([id, count]) => {
    const name = names.get(id) || '相手'
    return `${name}が${count}件追加しました`
  })
  return parts.join('、')
}
