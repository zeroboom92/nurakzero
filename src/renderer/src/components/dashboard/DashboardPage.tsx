import { useState } from 'react'
import type { UserTask } from '@/types'
import { useTaskStore } from '@/stores/taskStore'
import { SummaryPanel } from './SummaryPanel'
import { CategorySelector } from './CategorySelector'
import { MonthlyTaskList } from './MonthlyTaskList'
import { TaskEditor, EditorResult } from './TaskEditor'
import { Modal } from '../common/Modal'

/**
 * 전체 대시보드 화면 - 내 업무 전체 점검 상황을 월별로 확인하고
 * 항목을 추가/수정/삭제/월 변경한다.
 */
export function DashboardPage(): JSX.Element {
  const tasks = useTaskStore((s) => s.tasks)
  const selectedCategory = useTaskStore((s) => s.selectedCategory)
  const categories = useTaskStore((s) => s.categories)
  const addTask = useTaskStore((s) => s.addTask)
  const updateTask = useTaskStore((s) => s.updateTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<UserTask | null>(null)
  const [deleting, setDeleting] = useState<UserTask | null>(null)

  const categoryTasks = tasks.filter((t) => t.categoryId === selectedCategory)
  const categoryName = categories.find((c) => c.id === selectedCategory)?.name ?? '개인정보보호'

  const openAdd = (): void => {
    setEditing(null)
    setEditorOpen(true)
  }

  const openEdit = (task: UserTask): void => {
    setEditing(task)
    setEditorOpen(true)
  }

  const handleSubmit = (data: EditorResult): void => {
    if (editing) {
      updateTask(editing.id, {
        title: data.title.trim(),
        description: data.description.trim(),
        periodType: data.periodType,
        month: data.month,
        priority: data.priority,
        evidenceMemo: data.evidenceMemo.trim(),
        note: data.note.trim(),
        status: data.status ?? editing.status
      })
    } else {
      addTask({
        title: data.title,
        categoryId: selectedCategory,
        month: data.month,
        periodType: data.periodType,
        description: data.description,
        priority: data.priority,
        evidenceMemo: data.evidenceMemo,
        note: data.note
      })
    }
    setEditorOpen(false)
  }

  const confirmDelete = (): void => {
    if (deleting) deleteTask(deleting.id)
    setDeleting(null)
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header drag-region">
        <button
          type="button"
          className="icon-btn no-drag"
          onClick={() => window.api.closeDashboard()}
          title="대시보드 닫기"
        >
          ←
        </button>
        <div className="dashboard__titles">
          <h1 className="dashboard__title">
            <CategorySelector /> 업무 점검 대시보드
          </h1>
        </div>
        <button type="button" className="btn btn--primary no-drag" onClick={openAdd}>
          + 항목 추가
        </button>
      </header>

      <div className="dashboard__body">
        <SummaryPanel tasks={categoryTasks} />
        <MonthlyTaskList tasks={categoryTasks} onEdit={openEdit} onDelete={setDeleting} />
      </div>

      <TaskEditor
        open={editorOpen}
        task={editing}
        categoryId={selectedCategory}
        onClose={() => setEditorOpen(false)}
        onSubmit={handleSubmit}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="항목 삭제" width={380}>
        <p className="confirm-text">
          이 점검 항목을 삭제하시겠습니까?
          <br />
          <strong>{deleting?.title}</strong>
          <br />
          <span className="confirm-text__warn">삭제한 항목은 복구할 수 없습니다.</span>
        </p>
        <div className="editor__actions">
          <button className="btn btn--ghost" onClick={() => setDeleting(null)}>
            취소
          </button>
          <button className="btn btn--danger" onClick={confirmDelete}>
            삭제
          </button>
        </div>
      </Modal>

      <span className="dashboard__category-hint">{categoryName}</span>
    </div>
  )
}
