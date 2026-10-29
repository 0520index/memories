import { useCallback, useEffect, useState } from 'react'
import { forceReloadToLatest, hasUpdateAvailable } from '../lib/update'

export default function UpdateBanner() {
  const [available, setAvailable] = useState(false)
  const [busy, setBusy] = useState(false)

  const check = useCallback(async () => {
    if (import.meta.env.DEV) return
    setAvailable(await hasUpdateAvailable())
  }, [])

  useEffect(() => {
    void check()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void check()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    const id = window.setInterval(() => void check(), 60_000)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
      window.clearInterval(id)
    }
  }, [check])

  if (!available) return null

  return (
    <div className="update-banner" role="status">
      <span>新しいバージョンがあります</span>
      <button
        type="button"
        className="secondary small"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          await forceReloadToLatest()
        }}
      >
        {busy ? '更新中…' : 'Update'}
      </button>
    </div>
  )
}
