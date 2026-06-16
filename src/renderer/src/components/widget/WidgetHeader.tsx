import { useUiStore } from '@/stores/uiStore'
import { OpacityBar } from './OpacityBar'

/**
 * 위젯 상단 한 줄 툴바.
 * 왼쪽: 🏠(대시보드) · ⚙️(설정) · 제목, 오른쪽: 투명도 슬라이더.
 * 헤더 영역은 창 이동용 드래그 영역이며, 버튼·슬라이더는 no-drag 처리한다.
 */
export function WidgetHeader(): JSX.Element {
  const dashboardOpen = useUiStore((s) => s.dashboardOpen)
  const openDashboard = useUiStore((s) => s.openDashboard)
  const closeDashboard = useUiStore((s) => s.closeDashboard)
  const toggleSettings = useUiStore((s) => s.toggleSettings)

  return (
    <div className="widget-header drag-region">
      <div className="widget-header__left">
        <button
          type="button"
          className={`icon-btn no-drag ${dashboardOpen ? 'icon-btn--active' : ''}`}
          onClick={() => (dashboardOpen ? closeDashboard() : openDashboard())}
          title={dashboardOpen ? '대시보드 닫기' : '전체 대시보드 열기'}
          aria-label="대시보드"
        >
          🏠
        </button>
        <button
          type="button"
          className="icon-btn no-drag"
          onClick={toggleSettings}
          title="설정"
          aria-label="설정"
        >
          ⚙️
        </button>
      </div>
      <h1 className="widget-header__title">이번달 점검표</h1>
      <OpacityBar />
    </div>
  )
}
