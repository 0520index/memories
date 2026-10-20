import { useEffect, useState } from 'react'
import { parseImportSnippet, type ImportResult } from '../lib/importSnippet'
import { searchPlace, type GeoResult } from '../lib/geocode'
import { getCategory } from '../lib/categories'

type ApplyPayload = {
  result: ImportResult
  geo: GeoResult | null
}

type Props = {
  initialText?: string
  autoRun?: boolean
  onApply: (payload: ApplyPayload) => void
}

export default function ImportPaste({ initialText = '', autoRun = false, onApply }: Props) {
  const [text, setText] = useState(initialText)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportResult | null>(null)
  const [geoResults, setGeoResults] = useState<GeoResult[]>([])
  const [selectedGeo, setSelectedGeo] = useState<GeoResult | null>(null)
  const [didAuto, setDidAuto] = useState(false)

  useEffect(() => {
    if (!autoRun || !initialText.trim() || didAuto) return
    setDidAuto(true)
    void run(initialText)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, initialText, didAuto])

  async function run(source = text) {
    const trimmed = source.trim()
    if (!trimmed) {
      setError('テキストを貼り付けてください')
      return
    }
    setBusy(true)
    setError(null)
    setSelectedGeo(null)
    const result = parseImportSnippet(trimmed)
    setPreview(result)

    let geos: GeoResult[] = []
    if (result.searchQuery) {
      try {
        geos = await searchPlace(result.searchQuery)
        setGeoResults(geos)
        if (geos.length === 1) setSelectedGeo(geos[0])
      } catch {
        setGeoResults([])
        setError('場所の候補検索に失敗しました。名前は手入力で直せます')
      }
    } else {
      setGeoResults([])
      if (!result.title && result.urls.length > 0) {
        setError('リンクだけだと店名が取れないことがあります。キャプションも一緒に貼ると精度が上がります')
      }
    }

    onApply({ result, geo: geos.length === 1 ? geos[0] : null })
    setBusy(false)
  }

  function pickGeo(g: GeoResult) {
    setSelectedGeo(g)
    if (preview) onApply({ result: preview, geo: g })
  }

  async function pasteFromClipboard() {
    try {
      const clip = await navigator.clipboard.readText()
      if (!clip.trim()) {
        setError('クリップボードが空です。インスタでコピーしてから再度タップしてください')
        return
      }
      setText(clip)
      await run(clip)
    } catch {
      setError('クリップボードを読めませんでした。下の欄に手動で貼り付けてください')
    }
  }

  return (
    <div className="import-box">
      <div className="import-head">
        <span>📲 インスタなどから貼り付け</span>
        <span className="muted small-text">iPhone はコピー → ここへ。ショートカットも可（設定）</span>
      </div>
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'例:\n📍渋谷カフェ ○○\n#カフェ #渋谷\nhttps://www.instagram.com/p/...'}
      />
      <div className="row wrap">
        <button type="button" className="secondary" onClick={() => void pasteFromClipboard()} disabled={busy}>
          クリップボードから
        </button>
        <button type="button" className="secondary" onClick={() => run()} disabled={busy}>
          {busy ? '読み取り中…' : '読み取って入力'}
        </button>
      </div>

      {error && <p className="muted small-text">{error}</p>}

      {preview && (preview.title || preview.memo) && (
        <div className="import-preview">
          {preview.category && (
            <div className="small-text">
              種類の候補: {getCategory(preview.category).icon} {getCategory(preview.category).label}
            </div>
          )}
          {preview.title && (
            <div className="small-text">
              名前: <strong>{preview.title}</strong>
            </div>
          )}
          {geoResults.length > 0 && (
            <div className="field">
              <span className="small-text">地図の候補（タップで位置をセット）</span>
              <ul className="results">
                {geoResults.map((g) => (
                  <li key={`${g.lat},${g.lng}`}>
                    <button
                      type="button"
                      className={selectedGeo === g ? 'selected' : ''}
                      onClick={() => pickGeo(g)}
                    >
                      {g.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
