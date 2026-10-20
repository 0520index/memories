import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { DEFAULT_CENTER, TILE_ATTRIBUTION, TILE_URL, icons } from '../lib/markers'
import { searchPlace, type GeoResult } from '../lib/geocode'

type LatLng = { lat: number; lng: number }

type Props = {
  value: LatLng | null
  onChange: (v: LatLng | null, address?: string) => void
  initialQuery: string
}

export default function LocationPicker({ value, onChange, initialQuery }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<GeoResult[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focus, setFocus] = useState<LatLng | null>(null)

  async function search() {
    if (!query.trim()) return
    setSearching(true)
    setError(null)
    try {
      const r = await searchPlace(query)
      setResults(r)
      if (r.length === 0) setError('見つかりませんでした。地図をタップして位置を指定することもできます')
    } catch (e) {
      setError((e as Error).message)
    }
    setSearching(false)
  }

  return (
    <div className="picker">
      <div className="row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              search()
            }
          }}
          placeholder="店名・住所で検索"
        />
        <button type="button" className="secondary" onClick={search} disabled={searching}>
          {searching ? '…' : '検索'}
        </button>
      </div>
      {error && <p className="muted small-text">{error}</p>}
      {results.length > 0 && (
        <ul className="results">
          {results.map((r) => (
            <li key={`${r.lat},${r.lng}`}>
              <button
                type="button"
                onClick={() => {
                  const v = { lat: r.lat, lng: r.lng }
                  onChange(v, r.label)
                  setFocus(v)
                  setResults([])
                }}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <MapContainer center={value ? [value.lat, value.lng] : DEFAULT_CENTER} zoom={value ? 15 : 10} className="map picker-map">
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <ClickToSet onPick={(v) => onChange(v)} />
        <Recenter value={focus} />
        {value && <Marker position={[value.lat, value.lng]} icon={icons.picker} />}
      </MapContainer>
      <div className="row between">
        <span className="muted small-text">地図をタップしても位置を指定できます</span>
        {value && (
          <button type="button" className="link" onClick={() => onChange(null)}>
            位置をクリア
          </button>
        )}
      </div>
    </div>
  )
}

function ClickToSet({ onPick }: { onPick: (v: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function Recenter({ value }: { value: LatLng | null }) {
  const map = useMap()
  useEffect(() => {
    if (value) map.setView([value.lat, value.lng], Math.max(map.getZoom(), 15))
  }, [value, map])
  return null
}
