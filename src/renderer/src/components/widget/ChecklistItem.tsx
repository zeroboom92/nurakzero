import { useState } from 'react'
import type { UserTask } from '@/types'
import { Checkbox } from '../common/Checkbox'

export interface WorkMeta {
  name: string
  color: string
  soft: string
}

interface ChecklistItemProps {
  task: UserTask
  delayed?: boolean
  /** 여러 업무를 함께 볼 때 어느 업무인지 표시(색 태그). 단일 업무면 생략. */
  work?: WorkMeta
  onToggle: (id: string) => void
}

/**
 * 메인 위젯의 점검 항목 한 줄.
 * 완료 체크 시 부드럽게 사라진 뒤 상태를 반영한다.
 * work가 주어지면 좌측 색 띠 + 업무 라벨로 어느 업무인지 명시한다.
 */
export function ChecklistItem({
  task,
  delayed = false,
  work,
  onToggle
}: ChecklistItemProps): JSX.Element {
  const [removing, setRemoving] = useState(false)

  const handleToggle = (): void => {
    setRemoving(true)
    window.setTimeout(() => onToggle(task.id), 260)
  }

  return (
    <div
      className={`check-item ${delayed ? 'check-item--delay' : ''} ${
        removing ? 'check-item--removing' : ''
      } ${work ? 'check-item--tagged' : ''}`}
      style={work ? { borderLeftColor: work.color } : undefined}
    >
      <Checkbox checked={false} onChange={handleToggle} variant={delayed ? 'delay' : 'default'} />
      <div className="check-item__main">
        <span className="check-item__title">{task.title}</span>
        {work && (
          <span className="check-item__work" style={{ color: work.color, background: work.soft }}>
            {work.name}
          </span>
        )}
      </div>
      {task.priority === 'high' && <span className="check-item__dot" title="중요" />}
    </div>
  )
}
