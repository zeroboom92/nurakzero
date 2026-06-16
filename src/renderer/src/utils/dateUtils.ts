const MONTH_LABELS = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월'
]

export function monthLabel(month: number): string {
  return MONTH_LABELS[month - 1] ?? `${month}월`
}

/** 1~12 범위로 순환시킨다. */
export function wrapMonth(month: number): number {
  return ((month - 1 + 12) % 12) + 1
}

export function currentMonth(now: Date = new Date()): number {
  return now.getMonth() + 1
}

export function currentYear(now: Date = new Date()): number {
  return now.getFullYear()
}

export function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate()
  ).padStart(2, '0')}`
}

export function nowIso(): string {
  return new Date().toISOString()
}
