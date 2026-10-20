import type { Category } from './lib/categories'

export type Couple = {
  id: string
  name: string
  anniversary: string | null
  invite_code: string
  created_at: string
}

export type Member = {
  couple_id: string
  user_id: string
  display_name: string | null
}

export type PlaceStatus = 'want' | 'visited'

export type Place = {
  id: string
  couple_id: string
  title: string
  category: Category
  status: PlaceStatus
  want_again: boolean
  visited_on: string | null
  rating: number | null
  tags: string[]
  memo: string | null
  address: string | null
  lat: number | null
  lng: number | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type PlaceInput = Omit<Place, 'id' | 'couple_id' | 'created_by' | 'created_at' | 'updated_at'>
