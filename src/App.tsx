import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isConfigured, supabase } from './lib/supabase'
import type { Couple } from './types'
import Auth from './components/Auth'
import CoupleSetup from './components/CoupleSetup'
import Home from './components/Home'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [couple, setCouple] = useState<Couple | null>(null)
  const [coupleLoading, setCoupleLoading] = useState(false)

  useEffect(() => {
    if (!isConfigured) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id

  const loadCouple = useCallback(async () => {
    if (!userId) {
      setCouple(null)
      return
    }
    setCoupleLoading(true)
    const { data: member } = await supabase
      .from('couple_members')
      .select('couple_id')
      .eq('user_id', userId)
      .maybeSingle()
    if (member) {
      const { data } = await supabase.from('couples').select('*').eq('id', member.couple_id).single()
      setCouple(data as Couple | null)
    } else {
      setCouple(null)
    }
    setCoupleLoading(false)
  }, [userId])

  useEffect(() => {
    loadCouple()
  }, [loadCouple])

  if (!isConfigured) {
    return (
      <div className="center-screen">
        <div className="card narrow">
          <h1 className="logo">ふたりの地図</h1>
          <p>Supabase の接続設定がありません。</p>
          <p className="muted">
            プロジェクト直下に <code>.env.local</code> を作成し、<code>VITE_SUPABASE_URL</code> と{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> を設定してください（README 参照）。
          </p>
        </div>
      </div>
    )
  }

  if (!authReady || coupleLoading) {
    return <div className="center-screen muted">読み込み中…</div>
  }

  if (!session) return <Auth />

  if (!couple) return <CoupleSetup onDone={setCouple} />

  return <Home couple={couple} userId={session.user.id} onCoupleChange={setCouple} />
}
