import { useTaskStore } from '@/stores/taskStore'
import { useUiStore } from '@/stores/uiStore'
import { buildWidgetBuckets } from '@/utils/taskStatusUtils'
import { WidgetHeader } from './WidgetHeader'
import { WidgetControls } from './WidgetControls'
import { ChecklistItem } from './ChecklistItem'
import { SettingsMenu } from './SettingsMenu'
import { ResizeGrip } from './ResizeGrip'

/**
 * 메인 위젯 화면 - '이번달 점검표' 카드 하나로 구성한다.
 * 지연 항목을 상단에, 이번 달 미완료 항목을 그 아래에 표시한다.
 * 완료된 항목은 표시하지 않는다.
 */
export function MonthlyChecklistWidget(): JSX.Element {
  const tasks = useTaskStore((s) => s.tasks)
  const selectedCategory = useTaskStore((s) => s.selectedCategory)
  const toggleComplete = useTaskStore((s) => s.toggleComplete)
  const viewMonth = useUiStore((s) => s.viewMonth)
  const settingsOpen = useUiStore((s) => s.settingsOpen)

  const categoryTasks = tasks.filter((t) => t.categoryId === selectedCategory)
  const { delayed, thisMonth, always } = buildWidgetBuckets(categoryTasks, viewMonth)

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
                <ChecklistItem key={task.id} task={task} delayed onToggle={toggleComplete} />
              ))}
            </section>
          )}

          {thisMonth.length > 0 && (
            <section className="widget-section">
              {delayed.length > 0 && <div className="widget-section__label">이번달</div>}
              {thisMonth.map((task) => (
                <ChecklistItem key={task.id} task={task} onToggle={toggleComplete} />
              ))}
            </section>
          )}

          {always.length > 0 && (
            <section className="widget-section">
              <div className="widget-section__label">수시</div>
              {always.map((task) => (
                <ChecklistItem key={task.id} task={task} onToggle={toggleComplete} />
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
