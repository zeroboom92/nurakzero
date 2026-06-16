import { useEffect } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { useUiStore } from '@/stores/uiStore'
import { MonthlyChecklistWidget } from '@/components/widget/MonthlyChecklistWidget'
import { DashboardWindow } from '@/components/dashboard/DashboardWindow'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'

// 같은 렌더러를 위젯 창과 대시보드 창이 공유한다. 해시로 역할을 구분한다.
// 대시보드 창의 해시는 'dashboard-left' / 'dashboard-right' (슬라이드 방향 포함).
const isDashboardWindow = window.location.hash.replace('#', '').startsWith('dashboard')

export default function App(): JSX.Element {
  const init = useTaskStore((s) => s.init)
  const reload = useTaskStore((s) => s.reload)
  const loaded = useTaskStore((s) => s.loaded)
  const onboarded = useTaskStore((s) => s.onboarded)
  const initSettings = useUiStore((s) => s.initSettings)
  const initDashboardSync = useUiStore((s) => s.initDashboardSync)

  useEffect(() => {
    if (isDashboardWindow) {
      reload()
    } else {
      init()
      initSettings()
    }
    // 두 창의 데이터를 동기화: 어느 창에서든 저장되면 다시 읽는다.
    const offDb = window.api.onDbChanged(() => reload())
    const offDash = isDashboardWindow ? undefined : initDashboardSync()
    return () => {
      offDb()
      offDash?.()
    }
  }, [init, reload, initSettings, initDashboardSync])

  if (!loaded) {
    return <div className="boot">불러오는 중…</div>
  }

  if (isDashboardWindow) return <DashboardWindow />
  return onboarded ? <MonthlyChecklistWidget /> : <OnboardingFlow />
}
