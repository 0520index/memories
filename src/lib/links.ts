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
