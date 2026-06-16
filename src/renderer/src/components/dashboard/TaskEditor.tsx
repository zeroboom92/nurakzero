import { useEffect, useState } from 'react'
import type { Priority, UserTask } from '@/types'
import { Modal } from '../common/Modal'
import { monthLabel } from '@/utils/dateUtils'

interface TaskEditorProps {
  open: boolean
  /** null이면 신규 추가, 값이 있으면 수정 */
  task: UserTask | null
  categoryId: string
  onClose: () => void
  onSubmit: (data: EditorResult) => void
}

export interface EditorResult {
  title: string
  description: string
  periodType: 'monthly' | 'always'
  month: number | null
  priority: Priority
  evidenceMemo: string
  note: string
  status?: UserTask['status']
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

const EMPTY: EditorResult = {
  title: '',
  description: '',
  periodType: 'monthly',
  month: new Date().getMonth() + 1,
  priority: 'medium',
  evidenceMemo: '',
  note: ''
}

export function TaskEditor({ open, task, onClose, onSubmit }: TaskEditorProps): JSX.Element {
  const [form, setForm] = useState<EditorResult>(EMPTY)

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description,
        periodType: task.periodType,
        month: task.month,
        priority: task.priority,
        evidenceMemo: task.evidenceMemo,
        note: task.note,
        status: task.status
      })
    } else {
      setForm({ ...EMPTY, month: new Date().getMonth() + 1 })
    }
  }, [task, open])

  const update = <K extends keyof EditorResult>(key: K, value: EditorResult[K]): void =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = (): void => {
    if (!form.title.trim()) return
    onSubmit({
      ...form,
      month: form.periodType === 'always' ? null : form.month ?? 1
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? '항목 수정' : '항목 추가'} width={440}>
      <div className="editor">
        <label className="field">
          <span className="field__label">항목명 *</span>
          <input
            className="field__input"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="예) 개인정보 처리방침 현행화"
            autoFocus
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field__label">시기</span>
            <select
              className="field__input"
              value={form.periodType}
              onChange={(e) => update('periodType', e.target.value as 'monthly' | 'always')}
            >
              <option value="monthly">월별</option>
              <option value="always">수시</option>
            </select>
          </label>

          <label className="field">
            <span className="field__label">월</span>
            <select
              className="field__input"
              value={form.month ?? ''}
              disabled={form.periodType === 'always'}
              onChange={(e) => update('month', Number(e.target.value))}
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">중요도</span>
            <select
              className="field__input"
              value={form.priority}
              onChange={(e) => update('priority', e.target.value as Priority)}
            >
              <option value="high">높음</option>
              <option value="medium">보통</option>
              <option value="low">낮음</option>
            </select>
          </label>
        </div>

        <label className="field">
          <span className="field__label">설명</span>
          <textarea
            className="field__input field__textarea"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={2}
            placeholder="점검 내용 설명"
          />
        </label>

        <label className="field">
          <span className="field__label">증빙자료 메모</span>
          <input
            className="field__input"
            value={form.evidenceMemo}
            onChange={(e) => update('evidenceMemo', e.target.value)}
            placeholder="예) 내부결재 문서, 홈페이지 캡처"
          />
        </label>

        <label className="field">
          <span className="field__label">비고</span>
          <input
            className="field__input"
            value={form.note}
            onChange={(e) => update('note', e.target.value)}
          />
        </label>

        <div className="editor__actions">
          <button className="btn btn--ghost" onClick={onClose}>
            취소
          </button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={!form.title.trim()}>
            {task ? '저장' : '추가'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
