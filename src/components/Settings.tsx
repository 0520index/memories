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
  const [copiedShare, setCopiedShare] = useState(false)
  const [updating, setUpdating] = useState(false)
  const shareBase = `${window.location.origin}/?text=`

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

  async function copyShareBase() {
    await navigator.clipboard.writeText(shareBase)
    setCopiedShare(true)
    setTimeout(() => setCopiedShare(false), 1500)
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
        <h3>iPhone からインスタの共有</h3>
        <p className="muted small-text">
          iPhone ではアプリが共有メニューに直接出せません。いちばん簡単なのは「コピー →
          クリップボードから」。共有シートに出したい場合は、下のショートカットを一度だけ作ってください。
        </p>
        <ol className="help-steps">
          <li>「ショートカット」アプリで新規作成</li>
          <li>情報（ⓘ）→「共有シートに表示」をオン（受け取る種類: テキスト・URL）</li>
          <li>アクション「URL」を追加し、次を貼る（入力は後ろに付ける）</li>
        </ol>
        <div className="invite">
          <code className="shortcut-url">{shareBase}</code>
          <button type="button" className="secondary full" onClick={copyShareBase}>
            {copiedShare ? 'コピーしました' : '共有用URLをコピー'}
          </button>
        </div>
        <ol className="help-steps" start={4}>
          <li>
            URLの末尾が <code>?text=</code> になるようにし、変数「ショートカット入力」をつなげる
          </li>
          <li>アクション「URLを開く」でそのURLを開く</li>
          <li>名前を「ふたりの地図」にして保存 → インスタの共有から選べます</li>
        </ol>
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
