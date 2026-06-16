import { useState } from 'react'
import type { UserTask } from '@/types'
import { Checkbox } from '../common/Checkbox'

interface ChecklistItemProps {
  task: UserTask
  delayed?: boolean
  onToggle: (id: string) => void
}

/**
 * 메인 위젯의 점검 항목 한 줄.
 * 완료 체크 시 부드럽게 사라진 뒤 상태를 반영한다.
 */
export function ChecklistItem({ task, delayed = false, onToggle }: ChecklistItemProps): JSX.Element {
  const [removing, setRemoving] = useState(false)

  const handleToggle = (): void => {
    setRemoving(true)
    window.setTimeout(() => onToggle(task.id), 260)
  }

  return (
    <div
      className={`check-item ${delayed ? 'check-item--delay' : ''} ${
        removing ? 'check-item--removing' : ''
      }`}
    >
      <Checkbox checked={false} onChange={handleToggle} variant={delayed ? 'delay' : 'default'} />
      <span className="check-item__title">{task.title}</span>
      {task.priority === 'high' && <span className="check-item__dot" title="중요" />}
    </div>
  )
}
