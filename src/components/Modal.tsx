import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  title: string
  onClose: () => void
  children: ReactNode
}

export default function Modal({ title, onClose, children }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)

    const scrollY = window.scrollY
    const { body } = document
    const html = document.documentElement
    const prev = {
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyOverflow: body.style.overflow,
      bodyTouch: body.style.touchAction,
      htmlOverflow: html.style.overflow,
    }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    body.style.touchAction = 'none'
    html.style.overflow = 'hidden'

    const blockBackgroundSwipe = (event: TouchEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      const backdrop = backdropRef.current
      const dialog = dialogRef.current
      if (!backdrop?.contains(target) || dialog?.contains(target)) return
      event.preventDefault()
    }
    document.addEventListener('touchmove', blockBackgroundSwipe, { passive: false })

    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('touchmove', blockBackgroundSwipe)
      body.style.position = prev.bodyPosition
      body.style.top = prev.bodyTop
      body.style.width = prev.bodyWidth
      body.style.overflow = prev.bodyOverflow
      body.style.touchAction = prev.bodyTouch
      html.style.overflow = prev.htmlOverflow
      window.scrollTo(0, scrollY)
    }
  }, [onClose])

  return (
    <div className="modal-backdrop" ref={backdropRef} onClick={onClose}>
      <div
        className="modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
