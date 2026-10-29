import { useState } from 'react'
import { loadTodayPickId, pickRandom, saveTodayPickId } from '../lib/todayPick'
import type { Place } from '../types'
import PlaceCard from './PlaceCard'
import Modal from './Modal'

type Props = {
  coupleId: string
  candidates: Place[]
  onOpen: (place: Place) => void
  onVisited: (place: Place) => void
}

export default function TodayPick({ coupleId, candidates, onOpen, onVisited }: Props) {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<Place | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function show(place: Place | null, message: string | null) {
    setPicked(place)
    setNotice(message)
    setOpen(true)
  }

  function draw(exceptId?: string) {
    if (candidates.length === 0) {
      show(null, 'やりたいリストが空です。＋から追加してから引いてください')
      return
    }
    const next = pickRandom(candidates, exceptId)
    if (!next) return
    saveTodayPickId(coupleId, next.id)
    const onlyOne = candidates.length === 1
    show(next, onlyOne && exceptId ? '候補はこの1件だけです' : null)
  }

  function reveal() {
    const savedId = loadTodayPickId(coupleId)
    const existing = savedId ? candidates.find((place) => place.id === savedId) : undefined
    if (existing) {
      show(existing, null)
      return
    }
    draw()
  }

  return (
    <>
      <button type="button" className="pick-button" onClick={reveal}>
        🎲 Today's Pick
      </button>
      {open && (
        <Modal title="Today's Pick" onClose={() => setOpen(false)}>
          {notice && <p className="muted center">{notice}</p>}
          {picked && (
            <>
              <p className="muted center">今日はこれはどう？</p>
              <ul className="list">
                <PlaceCard place={picked} onEdit={() => onOpen(picked)} onVisited={() => onVisited(picked)} />
              </ul>
              <div className="row between">
                <button type="button" className="secondary" onClick={() => draw(picked.id)}>
                  Shuffle
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={() => {
                    setOpen(false)
                    onOpen(picked)
                  }}
                >
                  Open
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  )
}
