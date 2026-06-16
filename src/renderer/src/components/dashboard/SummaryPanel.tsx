import type { UserTask } from '@/types'
import { summarize } from '@/utils/taskStatusUtils'

interface SummaryPanelProps {
  tasks: UserTask[]
}

export function SummaryPanel({ tasks }: SummaryPanelProps): JSX.Element {
  const s = summarize(tasks)
  return (
    <div className="summary-panel">
      <SummaryStat label="전체" value={s.total} tone="neutral" />
      <SummaryStat label="완료" value={s.completed} tone="done" />
      <SummaryStat label="미완료" value={s.pending} tone="pending" />
      <SummaryStat label="지연" value={s.delayed} tone="delay" />
    </div>
  )
}

function SummaryStat({
  label,
  value,
  tone
}: {
  label: string
  value: number
  tone: string
}): JSX.Element {
  return (
    <div className={`summary-stat summary-stat--${tone}`}>
      <span className="summary-stat__value">{value}</span>
      <span className="summary-stat__label">{label}</span>
    </div>
  )
}
