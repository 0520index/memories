import L from 'leaflet'
import type { Place } from '../types'

function pin(color: string) {
  return L.divIcon({
    className: 'pin-icon',
    html: `<span style="background:${color}"></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -24],
  })
}

export const icons = {
  want: pin('#4f8cff'),
  visited: pin('#f06292'),
  again: pin('#ffa726'),
  picker: pin('#7e57c2'),
}

export function iconFor(p: Place) {
  if (p.status === 'want') return icons.want
  return p.want_again ? icons.again : icons.visited
}

export const DEFAULT_CENTER: [number, number] = [35.681, 139.767]

export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
