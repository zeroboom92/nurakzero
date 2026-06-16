import type { UserTask } from '@/types'
import { currentMonth } from './dateUtils'

/**
 * 지연(delayed) 여부는 저장값이 아니라 현재 날짜 기준으로 파생 계산한다.
 * - 월별(monthly) 항목이고
 * - 예정 월이 현재 월보다 지났으며
 * - 아직 완료되지 않은 경우
 */
export function isDelayed(task: UserTask, now: Date = new Date()): boolean {
  if (task.status === 'completed' || task.status === 'skipped') return false
  if (task.periodType !== 'monthly' || task.month == null) return false
  return task.month < currentMonth(now)
}

export function isCompleted(task: UserTask): boolean {
  return task.status === 'completed'
}

/**
 * 메인 위젯에 표시할 항목인지 판단한다.
 * 표시 조건(작업지시서 7-1):
 *  - 보고 있는 월(viewMonth)에 해당하는 미완료 월별 항목
 *  - 현재 월을 보고 있을 때: 지연 항목 + 이번 달 노출로 설정한 수시 항목
 */
export interface WidgetBuckets {
  delayed: UserTask[]
  thisMonth: UserTask[]
  always: UserTask[]
}

export function buildWidgetBuckets(
  tasks: UserTask[],
  viewMonth: number,
  now: Date = new Date()
): WidgetBuckets {
  const isCurrentView = viewMonth === currentMonth(now)
  const delayed: UserTask[] = []
  const thisMonth: UserTask[] = []
  const always: UserTask[] = []

  for (const task of tasks) {
    if (isCompleted(task) || task.status === 'skipped') continue

    if (task.periodType === 'always') {
      // 수시 항목은 사용자가 이번 달 노출로 설정했고, 현재 월을 볼 때만 노출
      if (isCurrentView && task.pinnedToWidget) always.push(task)
      continue
    }

    // 월별 항목
    if (isCurrentView && isDelayed(task, now)) {
      delayed.push(task)
    } else if (task.month === viewMonth) {
      thisMonth.push(task)
    }
  }

  const byPriority = priorityComparator()
  delayed.sort(byPriority)
  thisMonth.sort(byPriority)
  always.sort(byPriority)

  return { delayed, thisMonth, always }
}

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 }

function priorityComparator() {
  return (a: UserTask, b: UserTask): number => {
    const pa = PRIORITY_RANK[a.priority] ?? 1
    const pb = PRIORITY_RANK[b.priority] ?? 1
    if (pa !== pb) return pa - pb
    return a.sortOrder - b.sortOrder
  }
}

export interface SummaryCounts {
  total: number
  completed: number
  pending: number
  delayed: number
}

export function summarize(tasks: UserTask[], now: Date = new Date()): SummaryCounts {
  let completed = 0
  let delayed = 0
  let pending = 0
  for (const task of tasks) {
    if (task.status === 'skipped') continue
    if (isCompleted(task)) {
      completed++
    } else if (isDelayed(task, now)) {
      delayed++
    } else {
      pending++
    }
  }
  return {
    total: completed + delayed + pending,
    completed,
    pending: pending + delayed, // 미완료 = 대기 + 지연
    delayed
  }
}
