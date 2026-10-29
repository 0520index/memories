import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CATEGORIES, DEFAULT_CATEGORY, normalizeCategory, type Category } from '../lib/categories'
import type { Couple, Place, PlaceInput } from '../types'
import AnniversaryBanner from './AnniversaryBanner'
import PlaceCard from './PlaceCard'
import PlaceForm from './PlaceForm'
import MapView from './MapView'
import Settings from './Settings'
import TodayPick from './TodayPick'

type Tab = 'want' | 'memories' | 'again' | 'map'
type SortKey = 'new' | 'old' | 'rating' | 'name'


type Props = {
  couple: Couple
  userId: string
  onCoupleChange: (c: Couple | null) => void
}

type Editing = { place: Place | null; preset?: Partial<PlaceInput> }

export default function Home({ couple, userId, onCoupleChange }: Props) {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('memories')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('new')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [showAllTags, setShowAllTags] = useState(false)
  const [tagQuery, setTagQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<Category | null>(null)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const upsertLocal = useCallback((p: Place) => {
    const normalized = {
      ...p,
      category: normalizeCategory(p.category),
      links: Array.isArray(p.links) ? p.links : [],
      tags: p.tags ?? [],
    }
    setPlaces((prev) => {
      const i = prev.findIndex((x) => x.id === normalized.id)
      if (i === -1) return [normalized, ...prev]
      const next = prev.slice()
      next[i] = normalized
      return next
    })
  }, [])

  const removeLocal = useCallback((id: string) => {
    setPlaces((prev) => prev.filter((x) => x.id !== id))
  }, [])

  useEffect(() => {
    let active = true
    supabase
      .from('places')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!active) return
        const list = ((data as Place[]) ?? []).map((p) => ({
          ...p,
          category: normalizeCategory(p.category),
          links: Array.isArray(p.links) ? p.links : [],
          tags: p.tags ?? [],
        }))
        setPlaces(list)
        setLoading(false)
      })

    const channel = supabase
      .channel(`places-${couple.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'places', filter: `couple_id=eq.${couple.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') removeLocal((payload.old as Place).id)
          else upsertLocal(payload.new as Place)
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [couple.id, upsertLocal, removeLocal])

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>()
    places.forEach((place) => {
      place.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1))
    })
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'))
  }, [places])

  const allTags = useMemo(
    () => [...tagCounts.map(([tag]) => tag)].sort((a, b) => a.localeCompare(b, 'ja')),
    [tagCounts],
  )

  const popularTags = tagCounts.slice(0, 8).map(([tag]) => tag)
  const shortcutTags =
    tagFilter && !popularTags.includes(tagFilter) ? [tagFilter, ...popularTags] : popularTags
  const matchedTags = tagCounts.filter(([tag]) => tag.toLowerCase().includes(tagQuery.trim().toLowerCase()))

  const usedCategories = useMemo(() => {
    const set = new Set(places.map((p) => normalizeCategory(p.category)))
    return CATEGORIES.filter((c) => set.has(c.id))
  }, [places])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = places
    if (tab === 'want') list = list.filter((p) => p.status === 'want')
    if (tab === 'memories') list = list.filter((p) => p.status === 'visited')
    if (tab === 'again') list = list.filter((p) => p.status === 'visited' && p.want_again)
    if (categoryFilter) list = list.filter((p) => normalizeCategory(p.category) === categoryFilter)
    if (tagFilter) list = list.filter((p) => p.tags.includes(tagFilter))
    if (q) {
      list = list.filter((p) =>
        [p.title, p.memo, p.address, ...p.tags, ...p.links].some((s) => s?.toLowerCase().includes(q)),
      )
    }
    return [...list].sort((a, b) => comparePlaces(a, b, sort))
  }, [places, tab, query, tagFilter, categoryFilter, sort])

  const counts = useMemo(
    () => ({
      want: places.filter((p) => p.status === 'want').length,
      memories: places.filter((p) => p.status === 'visited').length,
      again: places.filter((p) => p.status === 'visited' && p.want_again).length,
      map: places.filter((p) => p.lat != null).length,
    }),
    [places],
  )

  async function save(input: PlaceInput, id?: string) {
    const query = id
      ? supabase.from('places').update(input).eq('id', id)
      : supabase.from('places').insert({ ...input, couple_id: couple.id })
    const { data, error } = await query.select().single()
    if (error) throw new Error(error.message)
    upsertLocal(data as Place)
    setEditing(null)
  }

  async function remove(id: string) {
    const { error } = await supabase.from('places').delete().eq('id', id)
    if (error) throw new Error(error.message)
    removeLocal(id)
    setEditing(null)
  }

  function openNew() {
    const preset: Partial<PlaceInput> = {
      category: categoryFilter ?? DEFAULT_CATEGORY,
      ...(tab === 'memories' || tab === 'again'
        ? { status: 'visited' as const, want_again: tab === 'again', visited_on: today() }
        : { status: 'want' as const }),
    }
    setEditing({ place: null, preset })
  }

  function markVisited(place: Place) {
    setEditing({ place, preset: { status: 'visited', visited_on: today() } })
  }

  const filtering = Boolean(query || tagFilter || categoryFilter)
  const wantPlaces = useMemo(() => places.filter((place) => place.status === 'want'), [places])

  return (
    <div className="app">
      <header className="home-head">
        {tab === 'memories' ? (
          <>
            <p className="wordmark">Memories</p>
            <p className="tagline">ふたりの思い出を、地図に。</p>
          </>
        ) : (
          <h1 className="page-title">
            {tab === 'map' ? 'Map' : tab === 'again' ? 'Again' : 'Want'}
          </h1>
        )}
        {tab === 'memories' && (
          <AnniversaryBanner anniversary={couple.anniversary} onSet={() => setShowSettings(true)} />
        )}
        {(tab === 'want' || tab === 'again') && (
          <div className="segmented">
            <button type="button" className={tab === 'want' ? 'active' : ''} onClick={() => setTab('want')}>
              Want
              <span className="count">{counts.want}</span>
            </button>
            <button type="button" className={tab === 'again' ? 'active' : ''} onClick={() => setTab('again')}>
              Again
              <span className="count">{counts.again}</span>
            </button>
          </div>
        )}
      </header>

      {tab !== 'map' && (
        <div className="filters">
          <input
            type="search"
            placeholder="検索（名前・メモ・住所・タグ）"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <label className="sort-field">
            <span>Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort">
              <option value="new">Newest</option>
              <option value="old">Oldest</option>
              <option value="rating">Rating</option>
              <option value="name">Name</option>
            </select>
          </label>
          <div className="filter-group">
            <span className="filter-label">Category</span>
            <div className="chips">
              <button
                type="button"
                className={`category-chip ${categoryFilter === null ? 'active' : ''}`}
                onClick={() => setCategoryFilter(null)}
              >
                All
              </button>
              {CATEGORIES.map((c) => {
                const count = places.filter((p) => normalizeCategory(p.category) === c.id).length
                if (count === 0 && usedCategories.length > 0 && categoryFilter !== c.id) return null
                return (
                  <button
                    key={c.id}
                    className={`category-chip ${categoryFilter === c.id ? 'active' : ''}`}
                    onClick={() => setCategoryFilter(categoryFilter === c.id ? null : c.id)}
                  >
                    <span className="category-icon" aria-hidden="true">{c.icon}</span>
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>
          {tagCounts.length > 0 && (
            <div className="filter-group">
              <span className="filter-label">Tags</span>
              <div className="chips">
                {shortcutTags.map((tag) => (
                  <button
                    key={tag}
                    className={`tag-chip ${tagFilter === tag ? 'active' : ''}`}
                    onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                  >
                    #{tag}
                  </button>
                ))}
                {tagCounts.length > popularTags.length && (
                  <button
                    type="button"
                    className={`tag-chip ${showAllTags ? 'active' : ''}`}
                    onClick={() => setShowAllTags((open) => !open)}
                  >
                    All Tags
                  </button>
                )}
              </div>
            </div>
          )}
          {showAllTags && (
            <div className="tag-browser">
              <input
                type="search"
                placeholder="タグを検索"
                value={tagQuery}
                onChange={(e) => setTagQuery(e.target.value)}
                aria-label="タグを検索"
              />
              {matchedTags.length === 0 ? (
                <p className="muted small-text">一致するタグがありません</p>
              ) : (
                <div className="chips">
                  {matchedTags.map(([tag, count]) => (
                    <button
                      key={tag}
                      type="button"
                      className={`tag-chip ${tagFilter === tag ? 'active' : ''}`}
                      onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                    >
                      #{tag}
                      <span className="tag-count">{count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'want' && !loading && <TodayPick coupleId={couple.id} candidates={wantPlaces} onOpen={(place) => setEditing({ place })} onVisited={markVisited} />}

      <main className="content">
        {loading ? (
          <p className="muted center">読み込み中…</p>
        ) : tab === 'map' ? (
          <MapView places={places} onSelect={(p) => setEditing({ place: p })} />
        ) : filtered.length === 0 ? (
          <EmptyState tab={tab} filtering={filtering} />
        ) : (
          <ul className="list">
            {filtered.map((p) => (
              <PlaceCard key={p.id} place={p} onEdit={() => setEditing({ place: p })} onVisited={() => markVisited(p)} />
            ))}
          </ul>
        )}
      </main>

      <nav className="bottom-nav">
        <button type="button" className={tab === 'memories' ? 'active' : ''} onClick={() => setTab('memories')}>
          <NavIcon d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
          Home
        </button>
        <button
          type="button"
          className={tab === 'want' || tab === 'again' ? 'active' : ''}
          onClick={() => setTab('want')}
        >
          <NavIcon d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z" />
          Want
        </button>
        <button type="button" className="nav-add" onClick={openNew} aria-label="追加">
          ＋
        </button>
        <button type="button" className={tab === 'map' ? 'active' : ''} onClick={() => setTab('map')}>
          <NavIcon d="M9 18 3 20V6l6-2 6 2 6-2v14l-6 2-6-2zM9 4v14M15 6v14" />
          Map
        </button>
        <button type="button" onClick={() => setShowSettings(true)}>
          <NavIcon d="M12 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 12 12zM5 19.2c.8-2.8 3.5-4.4 7-4.4s6.2 1.6 7 4.4" />
          Me
        </button>
      </nav>

      {editing && (
        <PlaceForm
          place={editing.place}
          preset={editing.preset}
          existingTags={allTags}
          onSave={save}
          onDelete={remove}
          onClose={() => setEditing(null)}
        />
      )}

      {showSettings && (
        <Settings
          couple={couple}
          userId={userId}
          places={places}
          onClose={() => setShowSettings(false)}
          onCoupleChange={onCoupleChange}
        />
      )}
    </div>
  )
}

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function EmptyState({ tab, filtering }: { tab: Tab; filtering: boolean }) {
  if (filtering) return <p className="empty">条件に合う項目がありません</p>
  const text: Record<Exclude<Tab, 'map'>, string> = {
    want: '行きたい場所や見たい映画を ＋ から追加しよう',
    memories: '二人で行った場所・見た映画を記録しよう',
    again: '思い出で「Want again」をオンにするとここに並びます',
  }
  return <p className="empty">{text[tab as Exclude<Tab, 'map'>]}</p>
}

function recentStamp(place: Place) {
  return place.visited_on ? `${place.visited_on}T12:00:00` : place.created_at
}

function comparePlaces(a: Place, b: Place, sort: SortKey) {
  if (sort === 'name') return a.title.localeCompare(b.title, 'ja')
  if (sort === 'rating') {
    const byRating = (b.rating ?? -1) - (a.rating ?? -1)
    if (byRating !== 0) return byRating
  }
  const byDate = recentStamp(b).localeCompare(recentStamp(a))
  return sort === 'old' ? -byDate : byDate
}

function today() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
