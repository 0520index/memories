import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { DEFAULT_CENTER, TILE_ATTRIBUTION, TILE_URL, iconFor } from '../lib/markers'
import { formatDate } from '../lib/date'
import type { Place } from '../types'
import Stars from './Stars'
import LinkButtons from './LinkButtons'

type Props = {
  places: Place[]
  onSelect: (p: Place) => void
}

export default function MapView({ places, onSelect }: Props) {
  const located = places.filter((p) => p.lat != null && p.lng != null)

  return (
    <div className="map-wrap">
      <MapContainer center={DEFAULT_CENTER} zoom={10} className="map full">
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <FitBounds places={located} />
        {located.map((p) => (
          <Marker key={p.id} position={[p.lat!, p.lng!]} icon={iconFor(p)}>
            <Popup>
              <div className="popup">
                <strong>{p.title}</strong>
                {p.visited_on && <div>{formatDate(p.visited_on)}</div>}
                <Stars value={p.rating} />
                <LinkButtons texts={[p.memo]} />
                <button className="link" onClick={() => onSelect(p)}>
                  詳細・編集
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="legend">
        <span><i className="dot want" />行きたい</span>
        <span><i className="dot visited" />行った</span>
        <span><i className="dot again" />また行きたい</span>
      </div>
      {located.length === 0 && <p className="muted center">場所を登録するときに地図で位置を選ぶと、ここに表示されます</p>}
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
