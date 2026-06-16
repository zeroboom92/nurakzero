import { useUiStore } from '@/stores/uiStore'

/** ⚙️ 버튼으로 여는 간단 설정 메뉴 (항상 위 / 시작 시 실행 / 최소화 / 종료). */
export function SettingsMenu(): JSX.Element {
  const {
    toggleSettings,
    alwaysOnTop,
    setAlwaysOnTop,
    startOnBoot,
    setStartOnBoot
  } = useUiStore()

  return (
    <>
      <div className="settings-backdrop no-drag" onClick={toggleSettings} />
      <div className="settings-pop no-drag">
        <label className="settings-row">
          <span>항상 위에 표시</span>
          <input
            type="checkbox"
            checked={alwaysOnTop}
            onChange={(e) => setAlwaysOnTop(e.target.checked)}
          />
        </label>
        <label className="settings-row">
          <span>시작 시 자동 실행</span>
          <input
            type="checkbox"
            checked={startOnBoot}
            onChange={(e) => setStartOnBoot(e.target.checked)}
          />
        </label>
        <div className="settings-divider" />
        <button className="settings-action" onClick={() => window.api.minimize()}>
          최소화
        </button>
        <button className="settings-action settings-action--danger" onClick={() => window.api.closeWindow()}>
          종료
        </button>
      </div>
    </>
  )
}
