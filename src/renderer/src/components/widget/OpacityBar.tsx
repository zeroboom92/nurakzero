import { useUiStore } from '@/stores/uiStore'

/** 위젯 상단 투명도 조절 바 (30% ~ 100%). */
export function OpacityBar(): JSX.Element {
  const opacity = useUiStore((s) => s.opacity)
  const setOpacity = useUiStore((s) => s.setOpacity)
  const percent = Math.round(opacity * 100)

  return (
    <div className="opacity-bar no-drag">
      <span className="opacity-bar__icon" aria-hidden>
        🌗
      </span>
      <input
        className="opacity-slider"
        type="range"
        min={30}
        max={100}
        value={percent}
        onChange={(e) => setOpacity(Number(e.target.value) / 100)}
        title={`투명도 ${percent}%`}
        aria-label="투명도 조절"
      />
    </div>
  )
}
