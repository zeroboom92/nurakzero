import type { PointerEvent as ReactPointerEvent } from 'react'

/**
 * 위젯 우하단 크기 조절 그립.
 * 좌상단 위치는 고정하고 우하단으로 드래그하여 크기를 조절한다.
 * 포인터 캡처를 사용해 커서가 창 밖으로 나가도(크게 키울 때) 계속 추적한다.
 */
export function ResizeGrip(): JSX.Element {
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    e.preventDefault()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)

    const startX = e.screenX
    const startY = e.screenY
    const startW = window.innerWidth
    const startH = window.innerHeight
    let raf = 0

    const onMove = (ev: PointerEvent): void => {
      const w = Math.max(320, startW + (ev.screenX - startX))
      const h = Math.max(360, startH + (ev.screenY - startY))
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => window.api.setWidgetSize(Math.round(w), Math.round(h)))
    }
    const onUp = (ev: PointerEvent): void => {
      cancelAnimationFrame(raf)
      el.releasePointerCapture(ev.pointerId)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
  }

  return (
    <div
      className="resize-grip no-drag"
      onPointerDown={onPointerDown}
      title="크기 조절"
      aria-label="크기 조절"
    >
      <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden>
        <path d="M11 4 L4 11 M11 8 L8 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  )
}
