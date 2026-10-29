import { againLabel, againLevelOf } from '../lib/again'
import { formatDate } from '../lib/date'
import { getCategory } from '../lib/categories'
import { placeLinks } from '../lib/links'
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
  const againLevel = againLevelOf(place)

  return (
    <li className={`place-card ${place.status} cat-${cat.id}`}>
      <button className="place-body" onClick={onEdit}>
        <div className="memory-top">
          <span>{place.visited_on ? formatDate(place.visited_on) : cat.want}</span>
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
