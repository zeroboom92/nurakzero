import { useTaskStore } from '@/stores/taskStore'
import { useUiStore } from '@/stores/uiStore'
import { buildWidgetBuckets } from '@/utils/taskStatusUtils'
import { WidgetHeader } from './WidgetHeader'
import { WidgetControls } from './WidgetControls'
import { ChecklistItem, type WorkMeta } from './ChecklistItem'
import { SettingsMenu } from './SettingsMenu'
import { ResizeGrip } from './ResizeGrip'

// 업무 색 팔레트 (학교급 태그와 동일 톤). 선택 순서대로 순환 배정.
const WORK_COLORS: Array<{ color: string; soft: string }> = [
  { color: '#d2796b', soft: '#fde3e0' },
  { color: '#c9924a', soft: '#fdeccf' },
  { color: '#4ba07e', soft: '#d9f0e3' },
  { color: '#5a8cc4', soft: '#dbe9f8' },
  { color: '#8f76c6', soft: '#ece1f7' },
  { color: '#c46a93', soft: '#fbe1ec' }
]

/**
 * 메인 위젯 화면 - '이번달 점검표' 카드 하나로 구성한다.
 * 선택한 모든 업무를 합쳐서, 지연 항목을 맨 위에 두어 어느 업무든 놓치지 않게 한다.
 * 업무가 2개 이상이면 항목마다 업무 색 태그를 붙여 어느 업무인지 명시한다.
 * 완료된 항목은 표시하지 않는다.
 */
export function MonthlyChecklistWidget(): JSX.Element {
  const tasks = useTaskStore((s) => s.tasks)
  const categories = useTaskStore((s) => s.categories)
  const toggleComplete = useTaskStore((s) => s.toggleComplete)
  const viewMonth = useUiStore((s) => s.viewMonth)
  const settingsOpen = useUiStore((s) => s.settingsOpen)

  // 모든 업무를 합쳐서 분류 (지연 우선은 업무 구분 없이 전체에 적용)
  const { delayed, thisMonth, always } = buildWidgetBuckets(tasks, viewMonth)

  const multiWork = categories.length > 1
  const workMeta: Record<string, WorkMeta> = {}
  categories.forEach((c, i) => {
    const c0 = WORK_COLORS[i % WORK_COLORS.length]
    workMeta[c.id] = { name: c.name, color: c0.color, soft: c0.soft }
  })
  const tagOf = (categoryId: string): WorkMeta | undefined =>
    multiWork ? workMeta[categoryId] : undefined

  const isEmpty = delayed.length === 0 && thisMonth.length === 0 && always.length === 0

  return (
    <div className="widget-shell">
      <div className="widget-card">
        <span className="widget-card__top-bar" aria-hidden />
        <WidgetHeader />

        <div className="widget-body">
          {isEmpty && (
            <div className="widget-empty">
              <div className="widget-empty__emoji">🌿</div>
              <p>이번 달 점검할 항목이 모두 끝났어요.</p>
              <span>완료한 항목은 대시보드에서 확인할 수 있어요.</span>
            </div>
          )}

          {delayed.length > 0 && (
            <section className="widget-section">
              <div className="widget-section__label widget-section__label--delay">지연</div>
              {delayed.map((task) => (
                <ChecklistItem
                  key={task.id}
                  task={task}
                  delayed
                  work={tagOf(task.categoryId)}
                  onToggle={toggleComplete}
                />
              ))}
            </section>
          )}

          {thisMonth.length > 0 && (
            <section className="widget-section">
              {delayed.length > 0 && <div className="widget-section__label">이번달</div>}
              {thisMonth.map((task) => (
                <ChecklistItem
                  key={task.id}
                  task={task}
                  work={tagOf(task.categoryId)}
                  onToggle={toggleComplete}
                />
              ))}
            </section>
          )}

          {always.length > 0 && (
            <section className="widget-section">
              <div className="widget-section__label">수시</div>
              {always.map((task) => (
                <ChecklistItem
                  key={task.id}
                  task={task}
                  work={tagOf(task.categoryId)}
                  onToggle={toggleComplete}
                />
              ))}
            </section>
          )}
        </div>

        <WidgetControls />
        {settingsOpen && <SettingsMenu />}
        <ResizeGrip />
      </div>
    </div>
  )
}
