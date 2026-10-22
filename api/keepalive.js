// Vercel Cron から1日1回呼ばれ、Supabase に軽い問い合わせを送る。
export default async function handler(_req, res) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    res.status(500).json({ ok: false })
    return
  }

  const response = await fetch(`${url}/rest/v1/places?select=id&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  })
  res.status(response.ok ? 200 : 502).json({ ok: response.ok })
}
