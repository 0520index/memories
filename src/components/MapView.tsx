import { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { againLevelOf } from '../lib/again'
import { DEFAULT_CENTER, TILE_ATTRIBUTION, TILE_URL, iconFor } from '../lib/markers'
import { formatDate } from '../lib/date'
import { placeLinks } from '../lib/links'
import type { Place } from '../types'
import Stars from './Stars'
import LinkButtons from './LinkButtons'

type PinKind = 'want' | 'visited' | 'again'

const LEGEND: { id: PinKind; label: string }[] = [
  { id: 'want', label: 'Want' },
  { id: 'visited', label: 'Visited' },
  { id: 'again', label: 'Again' },
]

function pinKind(place: Place): PinKind {
  if (place.status === 'want') return 'want'
  return againLevelOf(place) > 0 ? 'again' : 'visited'
}

type Props = {
  places: Place[]
  onSelect: (p: Place) => void
}

export default function MapView({ places, onSelect }: Props) {
  const [kind, setKind] = useState<PinKind | null>(null)
  const located = places.filter((p) => p.lat != null && p.lng != null)
  const shown = kind ? located.filter((place) => pinKind(place) === kind) : located

  return (
    <div className="map-wrap">
      <MapContainer center={DEFAULT_CENTER} zoom={10} className="map full">
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <FitBounds places={shown} />
        {shown.map((p) => (
          <Marker key={p.id} position={[p.lat!, p.lng!]} icon={iconFor(p)}>
            <Popup>
              <div className="popup">
                <strong>{p.title}</strong>
                {p.visited_on && <div>{formatDate(p.visited_on)}</div>}
                <Stars value={p.rating} />
                <LinkButtons urls={placeLinks(p)} />
                <button className="link" onClick={() => onSelect(p)}>
                  Edit
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="legend">
        {LEGEND.map((item) => (
          <button
            key={item.id}
            type="button"
            className={kind === item.id ? 'active' : kind ? 'dim' : ''}
            aria-pressed={kind === item.id}
            onClick={() => setKind(kind === item.id ? null : item.id)}
          >
            <i className={`dot ${item.id}`} />
            {item.label}
          </button>
        ))}
      </div>
      {located.length === 0 && <p className="muted center">場所を登録するときに地図で位置を選ぶと、ここに表示されます</p>}
      {located.length > 0 && shown.length === 0 && <p className="muted center">この色の場所はありません</p>}
    </div>
  )
}

function FitBounds({ places }: { places: Place[] }) {
  const map = useMap()
  const key = places.map((p) => p.id).join(',')
  useEffect(() => {
    if (places.length === 0) return
    if (places.length === 1) {
      map.setView([places[0].lat!, places[0].lng!], 14)
      return
    }
    map.fitBounds(L.latLngBounds(places.map((p) => [p.lat!, p.lng!])), { padding: [40, 40] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map])
  return null
}
