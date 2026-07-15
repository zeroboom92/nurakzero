import { useState } from 'react'
import { useUiStore } from '@/stores/uiStore'
import { useTaskStore } from '@/stores/taskStore'
import { Modal } from '../common/Modal'

/** ⚙️ 버튼으로 여는 간단 설정 메뉴 (항상 위 / 시작 시 실행 / 초기화 / 완전 삭제 / 최소화 / 종료). */
export function SettingsMenu(): JSX.Element {
  const {
    toggleSettings,
    alwaysOnTop,
    setAlwaysOnTop,
    startOnBoot,
    setStartOnBoot
  } = useUiStore()
  const resetOnboarding = useTaskStore((s) => s.resetOnboarding)

  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmHardReset, setConfirmHardReset] = useState(false)
  const [hardResetting, setHardResetting] = useState(false)

  const runReset = (): void => {
    resetOnboarding()
    setConfirmReset(false)
    toggleSettings()
  }

  const runHardReset = async (): Promise<void> => {
    setHardResetting(true)
    await window.api.hardResetApp()
    // 정상 흐름이면 메인 프로세스가 곧 앱을 종료시킨다.
  }

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
        <button className="settings-action" onClick={() => setConfirmReset(true)}>
          초기화 (온보딩부터 다시)
        </button>
        <button
          className="settings-action settings-action--danger"
          onClick={() => setConfirmHardReset(true)}
        >
          완전 삭제
        </button>
        <div className="settings-divider" />
        <button className="settings-action" onClick={() => window.api.minimize()}>
          최소화
        </button>
        <button className="settings-action settings-action--danger" onClick={() => window.api.closeWindow()}>
          종료
        </button>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="초기화" width={380}>
        <p className="confirm-text">
          모든 업무·점검 항목과 진행 상황이 삭제되고 온보딩부터 다시 시작합니다.
          <br />
          <span className="confirm-text__warn">삭제된 데이터는 복구할 수 없습니다.</span>
        </p>
        <div className="editor__actions">
          <button className="btn btn--ghost" onClick={() => setConfirmReset(false)}>
            취소
          </button>
          <button className="btn btn--danger" onClick={runReset}>
            초기화
          </button>
        </div>
      </Modal>

      <Modal
        open={confirmHardReset}
        onClose={() => (hardResetting ? undefined : setConfirmHardReset(false))}
        title="완전 삭제"
        width={380}
      >
        <p className="confirm-text">
          저장된 모든 데이터를 삭제하고 프로그램을 완전히 제거한 뒤 앱이 종료됩니다.
          <br />
          <span className="confirm-text__warn">
            이 작업은 되돌릴 수 없으며, 다시 사용하려면 설치 파일을 새로 실행해야 합니다.
          </span>
        </p>
        <div className="editor__actions">
          <button
            className="btn btn--ghost"
            onClick={() => setConfirmHardReset(false)}
            disabled={hardResetting}
          >
            취소
          </button>
          <button className="btn btn--danger" onClick={runHardReset} disabled={hardResetting}>
            {hardResetting ? '삭제 중…' : '완전 삭제'}
          </button>
        </div>
      </Modal>
    </>
  )
}
