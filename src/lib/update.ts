declare const __APP_VERSION__: string

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'

export async function fetchRemoteVersion(): Promise<string | null> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as { version?: string }
    return data.version ?? null
  } catch {
    return null
  }
}

export async function hasUpdateAvailable(): Promise<boolean> {
  const remote = await fetchRemoteVersion()
  if (!remote) return false
  return remote !== APP_VERSION
}

/** iPhone のホーム画面アプリでもキャッシュを捨てて最新を取りにいく */
export async function forceReloadToLatest() {
  try {
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
  } catch {
    // 失敗してもリロードは続行
  }
  // クエリを捨ててキャッシュバスト用のパラメータだけ付ける
  window.location.replace(`${window.location.origin}${window.location.pathname}?_v=${Date.now()}`)
}
