import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Couple } from '../types'

type Props = { onDone: (c: Couple) => void }

export default function CoupleSetup({ onDone }: Props) {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [displayName, setDisplayName] = useState('')
  const [name, setName] = useState('')
  const [anniversary, setAnniversary] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { data, error } =
      mode === 'create'
        ? await supabase.rpc('create_couple', {
            p_name: name,
            p_anniversary: anniversary || null,
            p_display_name: displayName,
          })
        : await supabase.rpc('join_couple', { p_code: code, p_display_name: displayName })
    setBusy(false)
    if (error) setError(error.message)
    else onDone(data as Couple)
  }

  return (
    <div className="center-screen">
      <form className="card narrow" onSubmit={submit}>
        <h2>ふたりのスペース</h2>
        <p className="muted">
          どちらか一人がスペースを作り、表示される招待コードをもう一人が入力すると、データが共有されます。
        </p>

        <div className="segmented">
          <button type="button" className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>
            新しく作る
          </button>
          <button type="button" className={mode === 'join' ? 'active' : ''} onClick={() => setMode('join')}>
            招待コードで参加
          </button>
        </div>

        <label>
          あなたの呼び名
          <input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="例: たろう" />
        </label>

        {mode === 'create' ? (
          <>
            <label>
              スペースの名前
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ふたりの思い出" />
            </label>
            <label>
              付き合った日
              <input type="date" value={anniversary} onChange={(e) => setAnniversary(e.target.value)} />
            </label>
          </>
        ) : (
          <label>
            招待コード
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="例: 1A2B3C4D"
              className="mono"
            />
          </label>
        )}

        {error && <p className="error">{error}</p>}

        <button className="primary" disabled={busy}>
          {busy ? '処理中…' : mode === 'create' ? '作成する' : '参加する'}
        </button>
        <button type="button" className="link" onClick={() => supabase.auth.signOut()}>
          ログアウト
        </button>
      </form>
    </div>
  )
}
