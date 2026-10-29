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
        <h2>Our Space</h2>
        <p className="muted">
          どちらか一人がスペースを作り、表示される招待コードをもう一人が入力すると、データが共有されます。
        </p>

        <div className="segmented">
          <button type="button" className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>
            Create
          </button>
          <button type="button" className={mode === 'join' ? 'active' : ''} onClick={() => setMode('join')}>
            Join
          </button>
        </div>

        <label>
          Name
          <input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="例: たろう" />
        </label>

        {mode === 'create' ? (
          <>
            <label>
              Space
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ふたりの思い出" />
            </label>
            <label>
              Anniversary
              <input type="date" value={anniversary} onChange={(e) => setAnniversary(e.target.value)} />
            </label>
          </>
        ) : (
          <label>
            Code
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
          {busy ? '処理中…' : mode === 'create' ? 'Create' : 'Join'}
        </button>
        <button type="button" className="link" onClick={() => supabase.auth.signOut()}>
          Log out
        </button>
      </form>
    </div>
  )
}
