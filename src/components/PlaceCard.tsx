import { againLabel, againLevelOf } from '../lib/again'
import { formatDate } from '../lib/date'
import { getCategory } from '../lib/categories'
import { placeLinks } from '../lib/links'
import type { Place } from '../types'
import Stars from './Stars'
import LinkButtons from './LinkButtons'

type Props = {
  place: Place
  authorName?: string | null
  compact?: boolean
  onEdit: () => void
  onVisited: () => void
}

export default function PlaceCard({ place, authorName, compact, onEdit, onVisited }: Props) {
  const cat = getCategory(place.category)
  const againLevel = againLevelOf(place)

  if (compact) {
    const links = placeLinks(place)
    const hasMeta = place.tags.length > 0 || links.length > 0
    return (
      <li className={`want-row cat-${cat.id}`}>
        <div className="want-row-top">
          <button type="button" className="want-row-main" onClick={onEdit}>
            <span className="pin-dot" aria-hidden="true" />
            <span className="want-copy">
              <span className="place-title">{place.title}</span>
              {place.address && <span className="want-area">{place.address}</span>}
            </span>
          </button>
          <button type="button" className="want-done" onClick={onVisited}>
            {cat.markDone}
          </button>
        </div>
        {hasMeta && (
          <div className="want-meta">
            {place.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                #{tag}
              </span>
            ))}
            <LinkButtons urls={links} className="in-row" />
          </div>
        )}
      </li>
    )
  }

  return (
    <li className={`place-card ${place.status} cat-${cat.id}`}>
      <button className="place-body" onClick={onEdit}>
        <div className="memory-top">
          <span>{place.visited_on ? formatDate(place.visited_on) : cat.want}</span>
          {authorName && <span className="author-name">{authorName}</span>}
        </div>
        <div className="memory-main">
          <span className="pin-dot" aria-hidden="true" />
          <div>
            <div className="place-title">{place.title}</div>
            {place.address && <div className="place-address">{place.address}</div>}
            {place.memo && <p className="place-memo">{place.memo}</p>}
            <Stars value={place.rating} />
          </div>
          {againLevel > 0 && <span className={`again-mark level-${againLevel}`}>{againLabel(againLevel)}</span>}
        </div>
        {place.tags.length > 0 && (
          <div className="chips">
            {place.tags.map((t) => (
              <span key={t} className="tag-chip">
                #{t}
              </span>
            ))}
          </div>
        )}
      </button>
      <div className="place-actions">
        <LinkButtons urls={placeLinks(place)} />
        {place.status === 'want' && (
          <button className="secondary small visited-button" onClick={onVisited}>
            {cat.markDone}
          </button>
        )}
      </div>
    </li>
  )
}
