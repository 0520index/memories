import { formatDate } from '../lib/date'
import { getCategory } from '../lib/categories'
import type { Place } from '../types'
import Stars from './Stars'
import LinkButtons from './LinkButtons'

type Props = {
  place: Place
  onEdit: () => void
  onVisited: () => void
}

export default function PlaceCard({ place, onEdit, onVisited }: Props) {
  const cat = getCategory(place.category)

  return (
    <li className={`place-card ${place.status} cat-${cat.id}`}>
      <button className="place-body" onClick={onEdit}>
        <div className="place-head">
          <span className="category-badge" title={cat.label}>
            {cat.icon} {cat.label}
          </span>
          <span className="place-title">{place.title}</span>
          {place.want_again && <span className="badge">{cat.again}</span>}
        </div>
        <div className="place-meta">
          {place.visited_on && <span>{formatDate(place.visited_on)}</span>}
          <Stars value={place.rating} />
        </div>
        {place.address && <div className="place-address">📍 {place.address}</div>}
        {place.memo && <p className="place-memo">{place.memo}</p>}
        {place.tags.length > 0 && (
          <div className="chips">
            {place.tags.map((t) => (
              <span key={t} className="chip static">
                #{t}
              </span>
            ))}
          </div>
        )}
      </button>
      <div className="place-actions">
        <LinkButtons texts={[place.memo, place.address]} />
        {place.status === 'want' && (
          <button className="secondary small visited-button" onClick={onVisited}>
            {cat.markDone}
          </button>
        )}
      </div>
    </li>
  )
}
