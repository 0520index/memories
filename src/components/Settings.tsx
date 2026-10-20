import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { APP_VERSION, forceReloadToLatest } from '../lib/update'
import type { Couple, Member } from '../types'
import Modal from './Modal'

type Props = {
  couple: Couple
  userId: string
  onClose: () => void
  onCoupleChange: (c: Couple | null) => void
}

export default function Settings({ couple, userId, onClose, onCoupleChange }: Props) {
  const [name, setName] = useState(couple.name)
  const [anniversary, setAnniversary] = useState(couple.anniversary ?? '')
  const [members, setMembers] = useState<Member[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    supabase
      .from('couple_members')
      .select('couple_id, user_id, display_name')
      .eq('couple_id', couple.id)
      .then(({ data }) => setMembers((data as Member[]) ?? []))
  }, [couple.id])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { data, error } = await supabase
      .from('couples')
      .update({ name: name.trim() || 'ふたりの思い出', anniversary: anniversary || null })
      .eq('id', couple.id)
      .select()
      .single()
    setBusy(false)
    if (error) return setError(error.message)
    onCoupleChange(data as Couple)
    onClose()
  }

  async function copyCode() {
    await navigator.clipboard.writeText(couple.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Modal title="設定" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>
          スペースの名前
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          付き合った日
          <input type="date" value={anniversary} onChange={(e) => setAnniversary(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={busy}>
          保存
        </button>
      </form>

      <section className="settings-section">
        <h3>メンバー</h3>
        <ul className="members">
          {members.map((m) => (
            <li key={m.user_id}>
              {m.display_name || '（名前なし）'}
              {m.user_id === userId && <span className="muted">（あなた）</span>}
            </li>
          ))}
        </ul>
        {members.length < 2 && (
          <div className="invite">
            <p className="muted">相手にこの招待コードを伝えて、「招待コードで参加」から入力してもらってください。</p>
            <div className="row">
              <code className="invite-code">{couple.invite_code}</code>
              <button type="button" className="secondary" onClick={copyCode}>
                {copied ? 'コピーしました' : 'コピー'}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="settings-section">
        <h3>アプリの更新</h3>
        <p className="muted small-text">
          改修を公開したあと、iPhone のホーム画面アプリが古いままのときはここから更新できます。
        </p>
        <p className="muted small-text">現在のバージョン: {APP_VERSION}</p>
        <button
          type="button"
          className="secondary full"
          disabled={updating}
          onClick={async () => {
            setUpdating(true)
            await forceReloadToLatest()
          }}
        >
          {updating ? '更新中…' : '最新版に更新（再読み込み）'}
        </button>
      </section>

      <section className="settings-section">
        <button
          type="button"
          className="secondary full"
          onClick={async () => {
            await supabase.auth.signOut()
            onCoupleChange(null)
          }}
        >
          ログアウト
        </button>
      </section>
    </Modal>
  )
}
