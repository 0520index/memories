import { againLabel, againLevelOf } from './again'
import { getCategory } from './categories'
import type { Couple, Place } from '../types'

export type ExportFile = {
  exported_at: string
  couple: {
    name: string
    anniversary: string | null
  }
  places: ExportPlace[]
}

type ExportPlace = {
  id: string
  title: string
  category: string
  status: string
  want_again: boolean
  again_level: number
  visited_on: string | null
  rating: number | null
  tags: string[]
  memo: string | null
  links: string[]
  address: string | null
  lat: number | null
  lng: number | null
  created_at: string
  updated_at: string
}

export function buildExport(couple: Couple, places: Place[]): ExportFile {
  return {
    exported_at: new Date().toISOString(),
    couple: { name: couple.name, anniversary: couple.anniversary },
    places: places.map((place) => ({
      id: place.id,
      title: place.title,
      category: place.category,
      status: place.status,
      want_again: againLevelOf(place) > 0,
      again_level: againLevelOf(place),
      visited_on: place.visited_on,
      rating: place.rating,
      tags: place.tags ?? [],
      memo: place.memo,
      links: place.links ?? [],
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      created_at: place.created_at,
      updated_at: place.updated_at,
    })),
  }
}

export function toCsv(file: ExportFile) {
  const headers = ['名前', '種類', '状態', 'また行きたい', '日付', '評価', 'タグ', 'メモ', 'リンク', '住所', '緯度', '経度', '追加日時']
  const rows = file.places.map((place) => {
    const category = getCategory(place.category)
    const statusLabel = place.status === 'visited' ? category.done : category.want
    const again = againLabel(place.again_level)
    return [
      place.title,
      category.label,
      statusLabel,
      again,
      place.visited_on ?? '',
      place.rating == null ? '' : String(place.rating),
      place.tags.join(' '),
      place.memo ?? '',
      place.links.join(' '),
      place.address ?? '',
      place.lat == null ? '' : String(place.lat),
      place.lng == null ? '' : String(place.lng),
      place.created_at,
    ]
  })
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n')}`
}

export function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportBasename(coupleName: string) {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const safe = coupleName.replace(/[\\/:*?"<>|]/g, '').trim() || 'ふたりの地図'
  return `${safe}-${date}`
}

function csvEscape(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}
