import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('メールアドレスかパスワードが違います')
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) setError(error.message)
      else if (!data.session) setMessage('確認メールを送りました。メール内のリンクを開いてからログインしてください。')
    }
    setBusy(false)
  }

  return (
    <div className="center-screen">
      <form className="card narrow" onSubmit={submit}>
        <h1 className="logo">ふたりの地図</h1>
        <p className="muted center">思い出と、行きたい場所を二人で。</p>

        <div className="segmented">
          <button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>
            ログイン
          </button>
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
            新規登録
          </button>
        </div>

        <label>
          メールアドレス
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label>
          パスワード（6文字以上）
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />
        </label>

        {error && <p className="error">{error}</p>}
        {message && <p className="notice">{message}</p>}

        <button className="primary" disabled={busy}>
          {busy ? '処理中…' : mode === 'signin' ? 'ログイン' : 'アカウントを作成'}
        </button>
      </form>
    </div>
  )
}
