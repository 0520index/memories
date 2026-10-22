const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi

export function extractUrls(...parts: (string | null | undefined)[]): string[] {
  const seen = new Set<string>()
  const urls: string[] = []
  for (const part of parts) {
    if (!part) continue
    for (const m of part.matchAll(URL_RE)) {
      const url = m[0].replace(/[),.]+$/, '')
      if (seen.has(url)) continue
      seen.add(url)
      urls.push(url)
    }
  }
  return urls
}

export function normalizeUrl(raw: string): string | null {
  let value = raw.trim()
  if (!value) return null
  if (!/^https?:\/\//i.test(value)) {
    if (!/^[\w.-]+\.[a-z]{2,}([/?#].*)?$/i.test(value)) return null
    value = `https://${value}`
  }
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

/** 専用欄が空なら、以前メモに書いていた URL を使う */
export function placeLinks(place: { links?: string[] | null; memo?: string | null }) {
  if (place.links && place.links.length > 0) return place.links
  return extractUrls(place.memo)
}

export function shortenUrl(url: string, max = 42) {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    const path = u.pathname === '/' ? '' : u.pathname
    const label = host + path
    return label.length > max ? `${label.slice(0, max - 1)}…` : label
  } catch {
    return url.length > max ? `${url.slice(0, max - 1)}…` : url
  }
}
