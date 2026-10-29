import L from 'leaflet'
import type { Place } from '../types'

function pin(token: string) {
  return L.divIcon({
    className: 'pin-icon',
    html: `<span style="background:var(${token})"></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 26],
    popupAnchor: [0, -24],
  })
}

export const icons = {
  want: pin('--pin-want'),
  visited: pin('--pin-visited'),
  again: pin('--pin-again'),
  picker: pin('--pin-picker'),
}

export function iconFor(p: Place) {
  if (p.status === 'want') return icons.want
  return p.want_again ? icons.again : icons.visited
}

export const DEFAULT_CENTER: [number, number] = [35.681, 139.767]

export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
