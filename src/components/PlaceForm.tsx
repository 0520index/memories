import { useState, type FormEvent } from 'react'
import type { Place, PlaceInput } from '../types'
import { CATEGORIES, DEFAULT_CATEGORY, getCategory } from '../lib/categories'
import Stars from './Stars'
import LocationPicker from './LocationPicker'
import LinkButtons from './LinkButtons'
import Modal from './Modal'

type Props = {
  place: Place | null
  preset?: Partial<PlaceInput>
  existingTags: string[]
  onSave: (input: PlaceInput, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

const EMPTY: PlaceInput = {
  title: '',
  category: DEFAULT_CATEGORY,
  status: 'want',
  want_again: false,
  visited_on: null,
  rating: null,
  tags: [],
  memo: null,
  address: null,
  lat: null,
  lng: null,
}

export default function PlaceForm({ place, preset, existingTags, onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState<PlaceInput>(() => ({ ...EMPTY, ...pick(place), ...preset }))
  const [tagDraft, setTagDraft] = useState('')
  const [showMap, setShowMap] = useState(form.lat != null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof PlaceInput>(key: K, value: PlaceInput[K]) => setForm((f) => ({ ...f, [key]: value }))
  const cat = getCategory(form.category)
  const visited = form.status === 'visited'

  function addTag(raw: string) {
    const t = raw.trim().replace(/^#/, '')
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t])
    setTagDraft('')
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const input: PlaceInput = {
      ...form,
      title: form.title.trim(),
      category: form.category || DEFAULT_CATEGORY,
      memo: form.memo?.trim() || null,
      address: form.address?.trim() || null,
      tags: tagDraft.trim() ? [...new Set([...form.tags, tagDraft.trim().replace(/^#/, '')])] : form.tags,
      visited_on: form.status === 'visited' ? form.visited_on : null,
      rating: form.status === 'visited' ? form.rating : null,
      want_again: form.status === 'visited' ? form.want_again : false,
    }
    if (!cat.showLocation) {
      input.lat = null
      input.lng = null
    }
    try {
      await onSave(input, place?.id)
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!place || !confirm(`「${place.title}」を削除しますか？`)) return
    setBusy(true)
    try {
      await onDelete(place.id)
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  const suggestions = existingTags.filter((t) => !form.tags.includes(t))
  const memoPlaceholder = visited
    ? `${cat.memoDone}\nインスタのリンクなどもここに貼れます`
    : `${cat.memoWant}\nインスタのリンクなどもここに貼れます`

  return (
    <Modal title={place ? '編集' : '追加'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="field">
          <span>種類</span>
          <div className="category-grid">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`category-option ${form.category === c.id ? 'active' : ''}`}
                onClick={() => set('category', c.id)}
              >
                <span className="category-icon">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <label>
          名前
          <input
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder={cat.titlePlaceholder}
          />
        </label>

        <div className="segmented">
          <button type="button" className={!visited ? 'active' : ''} onClick={() => set('status', 'want')}>
            {cat.want}
          </button>
          <button
            type="button"
            className={visited ? 'active' : ''}
            onClick={() => setForm((f) => ({ ...f, status: 'visited', visited_on: f.visited_on ?? todayIso() }))}
          >
            {cat.done}（思い出）
          </button>
        </div>

        {visited && (
          <>
            <label>
              {cat.done}日
              <input
                type="date"
                value={form.visited_on ?? ''}
                onChange={(e) => set('visited_on', e.target.value || null)}
              />
            </label>
            <div className="field">
              <span>評価</span>
              <Stars value={form.rating} onChange={(v) => set('rating', v)} />
            </div>
            <label className="toggle">
              <input type="checkbox" checked={form.want_again} onChange={(e) => set('want_again', e.target.checked)} />
              {cat.again}
            </label>
          </>
        )}

        <label>
          メモ・リンク
          <textarea
            rows={4}
            value={form.memo ?? ''}
            onChange={(e) => set('memo', e.target.value)}
            placeholder={memoPlaceholder}
          />
        </label>
        <LinkButtons texts={[form.memo]} />

        <div className="field">
          <span>タグ</span>
          <div className="chips">
            {form.tags.map((t) => (
              <button
                key={t}
                type="button"
                className="chip active"
                onClick={() => set('tags', form.tags.filter((x) => x !== t))}
                aria-label={`${t} を外す`}
              >
                #{t} ×
              </button>
            ))}
          </div>
          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addTag(tagDraft)
              }
            }}
            placeholder="例: カフェ、旅行（Enterで追加）"
          />
          {suggestions.length > 0 && (
            <div className="chips">
              {suggestions.map((t) => (
                <button key={t} type="button" className="chip" onClick={() => addTag(t)}>
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>

        {cat.showLocation && (
          <>
            <label>
              住所・エリア
              <input
                value={form.address ?? ''}
                onChange={(e) => set('address', e.target.value)}
                placeholder="例: 神奈川県藤沢市"
              />
            </label>

            {showMap ? (
              <LocationPicker
                initialQuery={form.address || form.title}
                value={form.lat != null && form.lng != null ? { lat: form.lat, lng: form.lng } : null}
                onChange={(v, address) =>
                  setForm((f) => ({
                    ...f,
                    lat: v?.lat ?? null,
                    lng: v?.lng ?? null,
                    address: address && !f.address ? address : f.address,
                  }))
                }
              />
            ) : (
              <button type="button" className="secondary" onClick={() => setShowMap(true)}>
                📍 地図で位置を指定
              </button>
            )}
          </>
        )}

        {error && <p className="error">{error}</p>}

        <div className="row between actions">
          {place ? (
            <button type="button" className="danger" onClick={handleDelete} disabled={busy}>
              削除
            </button>
          ) : (
            <span />
          )}
          <button className="primary" disabled={busy}>
            {busy ? '保存中…' : '保存'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function pick(place: Place | null): Partial<PlaceInput> {
  if (!place) return {}
  const { title, category, status, want_again, visited_on, rating, tags, memo, address, lat, lng } = place
  return {
    title,
    category: category || DEFAULT_CATEGORY,
    status,
    want_again,
    visited_on,
    rating,
    tags,
    memo,
    address,
    lat,
    lng,
  }
}

function todayIso() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
