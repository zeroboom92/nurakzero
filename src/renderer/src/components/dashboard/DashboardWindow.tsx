import { DashboardPage } from './DashboardPage'

type Side = 'left' | 'right'

// 메인이 해시에 실어 보낸 슬라이드 방향을 동기적으로 읽는다.
// 비동기 IPC로 나중에 방향을 바꾸지 않으므로 첫 렌더부터 올바른 방향으로 그려진다.
const HASH = window.location.hash.replace('#', '')
const SIDE: Side = HASH.endsWith('left') ? 'left' : 'right'

/**
 * 대시보드 전용 창의 루트.
 * 위젯 창과 별개의 창이라 위젯에는 전혀 영향을 주지 않는다(버벅임 없음).
 * 위젯의 어느 쪽에 붙는지에 따라 위젯에 가까운 가장자리에서 슬라이드되어 들어온다.
 */
export function DashboardWindow(): JSX.Element {
  return (
    <div className={`dash-window dash-window--${SIDE}`}>
      <DashboardPage />
    </div>
  )
}
