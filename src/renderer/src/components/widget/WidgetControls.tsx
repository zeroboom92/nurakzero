import { useUiStore } from '@/stores/uiStore'
import { currentMonth, currentYear, monthLabel, wrapMonth } from '@/utils/dateUtils'

/**
 * 위젯 하단 월 이동 컨트롤 (◀ 2026년 6월 ▶).
 * 저번달/다음달 항목을 확인할 수 있다.
 */
export function WidgetControls(): JSX.Element {
  const viewMonth = useUiStore((s) => s.viewMonth)
  const setViewMonth = useUiStore((s) => s.setViewMonth)

  const cur = currentMonth()
  const year = currentYear()
  // 현재 월 기준으로 앞뒤 이동했을 때의 연도를 단순 표기
  const displayYear = year + (viewMonth < cur && cur - viewMonth > 6 ? 1 : viewMonth > cur && viewMonth - cur > 6 ? -1 : 0)

  return (
    <div className="widget-controls no-drag">
      <button
        type="button"
        className="month-nav"
        onClick={() => setViewMonth(wrapMonth(viewMonth - 1))}
        aria-label="저번달"
      >
        ◀
      </button>
      <button
        type="button"
        className={`month-label ${viewMonth === cur ? 'month-label--current' : ''}`}
        onClick={() => setViewMonth(cur)}
        title="이번 달로"
      >
        {displayYear}년 {monthLabel(viewMonth)}
      </button>
      <button
        type="button"
        className="month-nav"
        onClick={() => setViewMonth(wrapMonth(viewMonth + 1))}
        aria-label="다음달"
      >
        ▶
      </button>
    </div>
  )
}
