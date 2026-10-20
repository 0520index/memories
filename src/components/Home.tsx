import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CATEGORIES, DEFAULT_CATEGORY, normalizeCategory, type Category } from '../lib/categories'
import type { Couple, Place, PlaceInput } from '../types'
import AnniversaryBanner from './AnniversaryBanner'
import PlaceCard from './PlaceCard'
import PlaceForm from './PlaceForm'
import MapView from './MapView'
import Settings from './Settings'

type Tab = 'want' | 'memories' | 'again' | 'map'

const TABS: { id: Tab; label: string }[] = [
  { id: 'want', label: 'やりたい' },
  { id: 'memories', label: '思い出' },
  { id: 'again', label: 'またやりたい' },
  { id: 'map', label: '地図' },
]

type Props = {
  couple: Couple
  userId: string
  onCoupleChange: (c: Couple | null) => void
}

type Editing = { place: Place | null; preset?: Partial<PlaceInput> }

export default function Home({ couple, userId, onCoupleChange }: Props) {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('want')
  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<Category | null>(null)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const upsertLocal = useCallback((p: Place) => {
    const normalized = { ...p, category: normalizeCategory(p.category) }
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

  const allTags = useMemo(() => {
    const set = new Set<string>()
    places.forEach((p) => p.tags.forEach((t) => set.add(t)))
    return [...set].sort()
  }, [places])

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
        [p.title, p.memo, p.address, ...p.tags].some((s) => s?.toLowerCase().includes(q)),
      )
    }
    if (tab === 'memories' || tab === 'again') {
      list = [...list].sort((a, b) => (b.visited_on ?? '').localeCompare(a.visited_on ?? ''))
    }
    return list
  }, [places, tab, query, tagFilter, categoryFilter])

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

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="logo small">{couple.name}</h1>
        <button className="icon-button" onClick={() => setShowSettings(true)} aria-label="設定">
          ⚙
        </button>
      </header>

      <AnniversaryBanner anniversary={couple.anniversary} onSet={() => setShowSettings(true)} />

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
            <span className="count">{counts[t.id]}</span>
          </button>
        ))}
      </nav>

      {tab !== 'map' && (
        <div className="filters">
          <input
            type="search"
            placeholder="検索（名前・メモ・住所・タグ）"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="chips">
            {CATEGORIES.map((c) => {
              const count = places.filter((p) => normalizeCategory(p.category) === c.id).length
              if (count === 0 && usedCategories.length > 0 && categoryFilter !== c.id) return null
              return (
                <button
                  key={c.id}
                  className={`chip category-chip ${categoryFilter === c.id ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(categoryFilter === c.id ? null : c.id)}
                >
                  {c.icon} {c.label}
                </button>
              )
            })}
          </div>
          {allTags.length > 0 && (
            <div className="chips">
              {allTags.map((t) => (
                <button
                  key={t}
                  className={`chip ${tagFilter === t ? 'active' : ''}`}
                  onClick={() => setTagFilter(tagFilter === t ? null : t)}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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

      <button className="fab" onClick={openNew} aria-label="追加">
        ＋
      </button>

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
          onClose={() => setShowSettings(false)}
          onCoupleChange={onCoupleChange}
        />
      )}
    </div>
  )
}

function EmptyState({ tab, filtering }: { tab: Tab; filtering: boolean }) {
  if (filtering) return <p className="empty">条件に合う項目がありません</p>
  const text: Record<Exclude<Tab, 'map'>, string> = {
    want: '行きたい場所や見たい映画を ＋ から追加しよう',
    memories: '二人で行った場所・見た映画を記録しよう',
    again: '思い出で「またやりたい」をオンにするとここに並びます',
  }
  return <p className="empty">{text[tab as Exclude<Tab, 'map'>]}</p>
}

function today() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
