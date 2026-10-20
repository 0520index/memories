export type GeoResult = {
  label: string
  lat: number
  lng: number
}

// Nominatim の利用規約上、検索はユーザー操作時のみ（1秒1回以内）に行う
export async function searchPlace(query: string): Promise<GeoResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    'accept-language': 'ja',
  })
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`)
  if (!res.ok) throw new Error('住所検索に失敗しました')
  const data: { display_name: string; lat: string; lon: string }[] = await res.json()
  return data.map((r) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }))
}
