import type { Category } from './categories'

export type ImportResult = {
  title: string | null
  memo: string | null
  tags: string[]
  /** 地図検索に使う候補 */
  searchQuery: string | null
  category: Category | null
  urls: string[]
}

const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi
const INSTAGRAM_RE = /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/[^\s<>"')\]]+/i

const LOCATION_LINE_RE =
  /^(?:📍|📌|🏠|🏡|🗺|住所[:：]?|場所[:：]?|所在地[:：]?|アクセス[:：]?)\s*(.+)$/u

const TITLE_PREFIX_RE =
  /^(?:店名|店舗名|カフェ名|レストラン|施設名|スポット|タイトル)[:：]\s*(.+)$/u

const BRACKET_RE = /[【「『]([^】」』]{2,40})[】」』]/

const AREA_SPLIT_RE = /^(.+?)\s*[|｜／/・]\s*(.+)$/

const FOOD_HINT =
  /カフェ|食堂|レストラン|ラーメン|焼肉|寿司|居酒屋|ベーカリー|パン|ケーキ|スイーツ|ランチ|ディナー|グルメ|食べ|飯|バー|居酒屋/i
const MOVIE_HINT = /映画|シネマ|劇場|鑑賞|公開|予告|cinema|movie/i
const BOOK_HINT = /本|小説|文庫|漫画|マンガ|読書|著|出版社|book/i

/**
 * インスタの共有テキスト・キャプション・URLから、フォーム用の候補を抜き出す
 */
export function parseImportSnippet(raw: string): ImportResult {
  const text = raw.replace(/\u00a0/g, ' ').trim()
  if (!text) {
    return emptyResult()
  }

  const urls = [...text.matchAll(URL_RE)].map((m) => cleanUrl(m[0]))
  const uniqueUrls = [...new Set(urls)]
  const instagramUrls = uniqueUrls.filter((u) => INSTAGRAM_RE.test(u))
  const primaryUrl = instagramUrls[0] ?? uniqueUrls[0] ?? null

  const withoutUrls = text.replace(URL_RE, ' ').replace(/\s+/g, ' ').trim()
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(URL_RE, '').trim())
    .filter(Boolean)

  const tags = extractHashtags(text)
  const category = guessCategory(text)

  let title: string | null = null
  let locationHint: string | null = null

  for (const line of lines) {
    const loc = line.match(LOCATION_LINE_RE)
    if (loc) {
      const value = stripDecor(loc[1])
      // 「📍店名」はそのままタイトル候補。住所っぽい場合は検索ヒントに回す
      if (!title && !looksLikeAddress(value)) title = value
      else locationHint = locationHint ?? value
      continue
    }
    const named = line.match(TITLE_PREFIX_RE)
    if (named && !title) {
      title = stripDecor(named[1])
      continue
    }
  }

  if (!title) {
    for (const line of lines) {
      const b = line.match(BRACKET_RE)
      if (b) {
        title = stripDecor(b[1])
        break
      }
    }
  }

  if (!title) {
    for (const line of lines) {
      if (LOCATION_LINE_RE.test(line) || TITLE_PREFIX_RE.test(line)) continue
      if (line.startsWith('#') || line.startsWith('＃')) continue
      const split = line.match(AREA_SPLIT_RE)
      if (split) {
        title = stripDecor(split[1])
        locationHint = locationHint ?? stripDecor(split[2])
        break
      }
      if (looksLikeTitle(line)) {
        title = stripDecor(line)
        break
      }
    }
  }

  // locationHint が空なら、ハッシュタグから地名っぽいものを検索に足す
  if (title && !locationHint) {
    const areaTag = tags.find(
      (t) =>
        t !== title &&
        !FOOD_HINT.test(t) &&
        !MOVIE_HINT.test(t) &&
        !BOOK_HINT.test(t) &&
        (/[都道府県市区町村]|駅$/.test(t) || (t.length >= 2 && t.length <= 8)),
    )
    if (areaTag) locationHint = areaTag
  }

  if (!title && withoutUrls && looksLikeTitle(withoutUrls) && withoutUrls.length <= 40) {
    title = stripDecor(withoutUrls)
  }

  const searchQuery = [title, locationHint].filter(Boolean).join(' ') || title || locationHint

  const memoParts: string[] = []
  if (primaryUrl) memoParts.push(`🔗 ${primaryUrl}`)
  const caption = lines
    .filter((l) => !LOCATION_LINE_RE.test(l) && !TITLE_PREFIX_RE.test(l))
    .join('\n')
    .trim()
  if (caption && caption !== title) {
    const clipped = caption.length > 500 ? `${caption.slice(0, 500)}…` : caption
    if (clipped) memoParts.push(clipped)
  }

  return {
    title,
    memo: memoParts.length ? memoParts.join('\n\n') : null,
    tags,
    searchQuery: searchQuery || null,
    category,
    urls: uniqueUrls,
  }
}

/** 共有ターゲットのクエリからテキストを組み立てる */
export function buildShareSnippet(params: URLSearchParams): string | null {
  const title = params.get('title')?.trim() ?? ''
  const text = params.get('text')?.trim() ?? ''
  const url = params.get('url')?.trim() ?? ''
  const parts = [title, text, url].filter(Boolean)
  if (parts.length === 0) return null
  // Instagram は text に URL を入れることが多いので重複除去
  const seen = new Set<string>()
  const unique: string[] = []
  for (const p of parts) {
    const key = p.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(p)
  }
  return unique.join('\n')
}

export function consumeShareParams(): string | null {
  const params = new URLSearchParams(window.location.search)
  const snippet = buildShareSnippet(params)
  if (!snippet && !params.has('title') && !params.has('text') && !params.has('url')) return null

  // URL を掃除して再読み込みで二重オープンしないようにする
  if (params.has('title') || params.has('text') || params.has('url')) {
    const url = new URL(window.location.href)
    url.searchParams.delete('title')
    url.searchParams.delete('text')
    url.searchParams.delete('url')
    window.history.replaceState({}, '', url.pathname + url.search + url.hash)
  }
  return snippet
}

function emptyResult(): ImportResult {
  return { title: null, memo: null, tags: [], searchQuery: null, category: null, urls: [] }
}

function cleanUrl(u: string) {
  return u.replace(/[),.]+$/, '')
}

function stripDecor(s: string) {
  return s
    .replace(/^[#＃\s📍📌🏠🏡🗺・\-–—]+/u, '')
    .replace(/[#＃].*$/u, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function looksLikeTitle(line: string) {
  if (line.length < 2 || line.length > 40) return false
  if (/^https?:\/\//i.test(line)) return false
  if ((line.match(/#/g) ?? []).length >= 3) return false
  return true
}

function looksLikeAddress(value: string) {
  return /[都道府県]|区|市|町|村|丁目|番地|\d{2,}/.test(value) && value.length >= 8
}

function extractHashtags(text: string) {
  const tags: string[] = []
  const seen = new Set<string>()
  for (const m of text.matchAll(/[#＃]([^\s#＃]{1,20})/gu)) {
    const t = m[1].replace(/[、。,.!！?？]+$/u, '')
    if (!t || seen.has(t)) continue
    // 長すぎるハッシュや URL っぽいものは除外
    if (/^https?/i.test(t) || t.length > 16) continue
    seen.add(t)
    tags.push(t)
    if (tags.length >= 8) break
  }
  return tags
}

function guessCategory(text: string): Category | null {
  if (MOVIE_HINT.test(text)) return 'movie'
  if (BOOK_HINT.test(text)) return 'book'
  if (FOOD_HINT.test(text)) return 'food'
  if (INSTAGRAM_RE.test(text) || /📍|住所|カフェ|ランチ/.test(text)) return 'place'
  return null
}
