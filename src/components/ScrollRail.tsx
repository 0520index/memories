import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

export default function ScrollRail() {
  const railRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ offset: number } | null>(null)
  const [thumb, setThumb] = useState({ top: 0, height: 36, visible: false })

  useEffect(() => {
    const update = () => {
      const el = document.scrollingElement
      const rail = railRef.current
      if (!el || !rail || document.documentElement.style.overflow === 'hidden') {
        setThumb((prev) => (prev.visible ? { ...prev, visible: false } : prev))
        return
      }
      const max = el.scrollHeight - el.clientHeight
      const track = rail.clientHeight
      const visible = max > 32 && track > 0
      const height = visible ? Math.max(44, (el.clientHeight / el.scrollHeight) * track) : 44
      const travel = Math.max(track - height, 1)
      const top = visible ? (el.scrollTop / max) * travel : 0
      setThumb({ top, height, visible })
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const observer = new ResizeObserver(update)
    observer.observe(document.body)
    const styleObserver = new MutationObserver(update)
    styleObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
    styleObserver.observe(document.body, { attributes: true, attributeFilter: ['style'] })
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      observer.disconnect()
      styleObserver.disconnect()
    }
  }, [])

  function scrollTo(clientY: number, offset: number) {
    const el = document.scrollingElement
    const rail = railRef.current
    if (!el || !rail) return
    const max = el.scrollHeight - el.clientHeight
    const track = rail.clientHeight
    const height = Math.max(44, (el.clientHeight / el.scrollHeight) * track)
    const travel = Math.max(track - height, 1)
    const y = clientY - rail.getBoundingClientRect().top - offset
    el.scrollTop = (Math.min(Math.max(y, 0), travel) / travel) * max
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const rail = railRef.current
    if (!rail) return
    rail.setPointerCapture(event.pointerId)
    const thumbTop = rail.getBoundingClientRect().top + thumb.top
    const offset = event.clientY >= thumbTop && event.clientY <= thumbTop + thumb.height ? event.clientY - thumbTop : thumb.height / 2
    drag.current = { offset }
    scrollTo(event.clientY, offset)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current) return
    scrollTo(event.clientY, drag.current.offset)
  }

  function onPointerUp() {
    drag.current = null
  }

  return (
    <div
      ref={railRef}
      className={`scroll-rail ${thumb.visible ? 'visible' : ''}`}
      aria-hidden="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <span className="scroll-rail-thumb" style={{ transform: `translateY(${thumb.top}px)`, height: thumb.height }} />
    </div>
  )
}
