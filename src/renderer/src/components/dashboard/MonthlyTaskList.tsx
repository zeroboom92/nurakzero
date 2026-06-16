import { useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { UserTask } from '@/types'
import { useTaskStore } from '@/stores/taskStore'
import { isDelayed } from '@/utils/taskStatusUtils'
import { formatDate, monthLabel } from '@/utils/dateUtils'

interface MonthlyTaskListProps {
  tasks: UserTask[]
  onEdit: (task: UserTask) => void
  onDelete: (task: UserTask) => void
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

/**
 * 대시보드 본문 - 월별 점검 항목 + 수시 + 완료됨 목록.
 *
 * 카드 왼쪽 핸들(⠿)을 잡아 다른 월/수시로 끌어다 놓을 수 있다.
 * 네이티브 HTML5 드래그는 Electron(user-select:none) 환경에서 불안정하므로
 * 포인터 이벤트로 직접 구현한다(드롭 대상은 elementFromPoint로 판정).
 * 드롭다운으로도 월을 바꿀 수 있다.
 */
export function MonthlyTaskList({ tasks, onEdit, onDelete }: MonthlyTaskListProps): JSX.Element {
  const toggleComplete = useTaskStore((s) => s.toggleComplete)
  const changeMonth = useTaskStore((s) => s.changeMonth)
  const togglePin = useTaskStore((s) => s.togglePinToWidget)

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragTitle, setDragTitle] = useState('')
  const [dragOver, setDragOver] = useState<string | null>(null)

  const dragId = useRef<string | null>(null)
  const lastPointer = useRef({ x: 0, y: 0 })
  const ghostRef = useRef<HTMLDivElement>(null)

  const active = tasks.filter((t) => t.status !== 'completed')
  const completed = tasks.filter((t) => t.status === 'completed')
  const monthlyActive = active.filter((t) => t.periodType === 'monthly')
  const alwaysActive = active.filter((t) => t.periodType === 'always')

  const itemsOfMonth = (m: number): UserTask[] =>
    monthlyActive.filter((t) => t.month === m).sort((a, b) => a.sortOrder - b.sortOrder)

  // 평소엔 항목이 있는 월만, 드래그 중엔 빈 월도 드롭 대상으로 모두 보여준다.
  const monthsToShow = draggingId ? MONTHS : MONTHS.filter((m) => itemsOfMonth(m).length > 0)

  const positionGhost = (x: number, y: number): void => {
    const g = ghostRef.current
    if (g) g.style.transform = `translate(${x + 14}px, ${y + 10}px)`
  }

  // 고스트가 처음 나타날 때 즉시 포인터 위치에 배치
  useLayoutEffect(() => {
    if (draggingId) positionGhost(lastPointer.current.x, lastPointer.current.y)
  }, [draggingId])

  const dropKeyAt = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y)
    const zone = el?.closest('[data-drop-key]') as HTMLElement | null
    return zone?.dataset.dropKey ?? null
  }

  const startDrag = (e: ReactPointerEvent, task: UserTask): void => {
    e.preventDefault()
    dragId.current = task.id
    lastPointer.current = { x: e.clientX, y: e.clientY }
    setDraggingId(task.id)
    setDragTitle(task.title)

    const onMove = (ev: PointerEvent): void => {
      lastPointer.current = { x: ev.clientX, y: ev.clientY }
      positionGhost(ev.clientX, ev.clientY)
      const key = dropKeyAt(ev.clientX, ev.clientY)
      setDragOver((prev) => (prev === key ? prev : key))
    }
    const onUp = (ev: PointerEvent): void => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      const key = dropKeyAt(ev.clientX, ev.clientY)
      const id = dragId.current
      if (id && key) changeMonth(id, key === 'always' ? null : Number(key))
      dragId.current = null
      setDraggingId(null)
      setDragOver(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const renderRow = (task: UserTask, draggable: boolean): JSX.Element => {
    const delayed = isDelayed(task)
    const done = task.status === 'completed'
    return (
      <div
        key={task.id}
        className={`task-row ${done ? 'task-row--done' : ''} ${
          draggingId === task.id ? 'task-row--dragging' : ''
        }`}
      >
        {draggable && (
          <span
            className="task-row__grip"
            onPointerDown={(e) => startDrag(e, task)}
            title="드래그하여 월 이동"
            aria-label="드래그하여 월 이동"
          >
            ⠿
          </span>
        )}
        <button
          type="button"
          className={`row-check ${done ? 'row-check--done' : ''} ${delayed ? 'row-check--delay' : ''}`}
          onClick={() => toggleComplete(task.id)}
          aria-label={done ? '완료 취소' : '완료'}
        >
          {done ? '✓' : ''}
        </button>

        <div className="task-row__main">
          <div className="task-row__title-line">
            <span className="task-row__title">{task.title}</span>
            {delayed && <span className="tag tag--delay">지연</span>}
            {task.priority === 'high' && <span className="tag tag--high">중요</span>}
            {task.periodType === 'always' && <span className="tag tag--always">수시</span>}
            {done && task.completedAt && (
              <span className="task-row__done-at">완료 {formatDate(task.completedAt)}</span>
            )}
          </div>
          {task.description && <p className="task-row__desc">{task.description}</p>}
        </div>

        <div className="task-row__actions no-drag">
          {task.periodType === 'always' ? (
            <button
              type="button"
              className={`pin-btn ${task.pinnedToWidget ? 'pin-btn--on' : ''}`}
              onClick={() => togglePin(task.id)}
              title="이번 달 위젯에 표시"
            >
              {task.pinnedToWidget ? '📌 표시중' : '📍 위젯표시'}
            </button>
          ) : (
            <select
              className="month-select"
              value={task.month ?? ''}
              onChange={(e) => changeMonth(task.id, Number(e.target.value))}
              title="월 변경"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          )}
          <button type="button" className="row-action" onClick={() => onEdit(task)} title="수정">
            ✏️
          </button>
          <button
            type="button"
            className="row-action row-action--danger"
            onClick={() => onDelete(task)}
            title="삭제"
          >
            🗑️
          </button>
        </div>
      </div>
    )
  }

  const showAlways = alwaysActive.length > 0 || draggingId !== null

  return (
    <div className="task-list">
      {monthsToShow.map((m) => {
        const items = itemsOfMonth(m)
        return (
          <section
            key={m}
            data-drop-key={String(m)}
            className={`task-group drop-zone ${dragOver === String(m) ? 'drop-zone--over' : ''}`}
          >
            <h3 className="task-group__title">{monthLabel(m)}</h3>
            {items.map((t) => renderRow(t, true))}
            {draggingId && items.length === 0 && <div className="drop-hint">여기에 놓기</div>}
          </section>
        )
      })}

      {showAlways && (
        <section
          data-drop-key="always"
          className={`task-group drop-zone ${dragOver === 'always' ? 'drop-zone--over' : ''}`}
        >
          <h3 className="task-group__title">수시</h3>
          {alwaysActive.sort((a, b) => a.sortOrder - b.sortOrder).map((t) => renderRow(t, true))}
          {draggingId && alwaysActive.length === 0 && (
            <div className="drop-hint">여기에 놓기 (수시)</div>
          )}
        </section>
      )}

      {completed.length > 0 && (
        <section className="task-group task-group--completed">
          <h3 className="task-group__title">완료됨 ({completed.length})</h3>
          {completed
            .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
            .map((t) => renderRow(t, false))}
        </section>
      )}

      {tasks.length === 0 && (
        <div className="task-list__empty">등록된 점검 항목이 없습니다. 항목을 추가해 보세요.</div>
      )}

      {draggingId && (
        <div ref={ghostRef} className="drag-ghost">
          {dragTitle}
        </div>
      )}
    </div>
  )
}
