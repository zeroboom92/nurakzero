export type PeriodType = 'monthly' | 'always'
export type Priority = 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'completed' | 'delayed' | 'skipped'

export interface Category {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface TaskTemplate {
  id: string
  categoryId: string
  title: string
  description: string
  defaultMonth: number | null
  defaultDay: number | null
  periodType: PeriodType
  priority: Priority
  evidence: string
  sortOrder: number
}

export interface UserTask {
  id: string
  templateId: string | null
  categoryId: string
  title: string
  description: string
  /** 월별 항목이면 1~12, 수시(always) 항목이면 null */
  month: number | null
  day: number | null
  periodType: PeriodType
  priority: Priority
  /** 저장되는 기본 상태값. 'delayed'는 날짜 기준으로 파생 계산한다. */
  status: TaskStatus
  evidenceMemo: string
  note: string
  completedAt: string | null
  /** 수시(always) 항목을 이번 달 위젯에 노출할지 여부 */
  pinnedToWidget: boolean
  createdAt: string
  updatedAt: string
  sortOrder: number
}

export type SchoolLevel = '유치원' | '초등학교' | '중학교' | '고등학교' | '특수학교'

export interface UserProfile {
  userName: string
  educationOffice: string
  schoolLevel: SchoolLevel
  schoolYear: number
  startMonth: number
  schoolName?: string
  hasKindergarten?: boolean
}

export interface AppSettings {
  selectedCategory: string | null
  alwaysOnTop: boolean
  startOnBoot: boolean
  theme: string
  onboarded: boolean
  profile: UserProfile | null
}

export interface DbShape {
  categories: Category[]
  user_tasks: UserTask[]
  settings: Record<string, unknown>
  schemaVersion: number
}
