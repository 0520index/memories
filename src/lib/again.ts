export type AgainLevel = 0 | 1 | 2 | 3

export const AGAIN_LEVELS: { level: Exclude<AgainLevel, 0>; label: string; hint: string }[] = [
  { level: 1, label: 'Maybe', hint: 'いつか' },
  { level: 2, label: 'Again', hint: 'また' },
  { level: 3, label: 'Soon', hint: '近いうち' },
]

export function againLevelOf(place: { again_level?: number | null; want_again?: boolean }): AgainLevel {
  const raw = place.again_level
  if (raw === 1 || raw === 2 || raw === 3 || raw === 0) return raw
  return place.want_again ? 2 : 0
}

export function againLabel(level: number) {
  return AGAIN_LEVELS.find((item) => item.level === level)?.label ?? ''
}
