import { create } from 'zustand'
import type { Category, Priority, UserTask, UserProfile } from '@/types'
import { createWorkInstanceFromTemplate } from '@/services/templateService'
import type { DetailedTemplate, DetailedTemplateTask, TemplateIndexItem } from '@/types/template'
import { nowIso } from '@/utils/dateUtils'

function genId(prefix = 'task'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** 선택한 표준 업무(Category)를 만든다. Category.id = templateId. */
function buildCategory(item: TemplateIndexItem): Category {
  const ts = nowIso()
  return {
    id: item.templateId,
    name: item.displayTitle,
    description: item.category,
    createdAt: ts,
    updatedAt: ts
  }
}

function taskEvidenceMemo(task: DetailedTemplateTask): string {
  return task.evidence.join('\n')
}

function normalizePriority(priority: DetailedTemplateTask['priority']): Priority {
  if (priority === 'high' || priority === 'medium' || priority === 'low') return priority
  return 'medium'
}

/** 세부 템플릿 task 배열로부터 사용자 점검 항목 인스턴스를 생성한다. */
function buildTasksForTemplate(template: DetailedTemplate): UserTask[] {
  const ts = nowIso()
  return template.tasks.map((task, idx) => ({
    id: genId(),
    templateId: task.templateTaskId,
    categoryId: template.templateId,
    title: task.title,
    description: task.description,
    month: task.recommendedMonth,
    day: task.recommendedDay ?? null,
    periodType: task.recommendedMonth == null ? 'always' : 'monthly',
    priority: normalizePriority(task.priority),
    status: 'pending',
    evidenceMemo: taskEvidenceMemo(task),
    note: '',
    completedAt: null,
    pinnedToWidget: false,
    createdAt: ts,
    updatedAt: ts,
    sortOrder: idx
  }))
}

export interface NewTaskInput {
  title: string
  categoryId: string
  month: number | null
  periodType: 'monthly' | 'always'
  description: string
  priority: 'high' | 'medium' | 'low'
  evidenceMemo: string
  note: string
}

interface TaskState {
  loaded: boolean
  onboarded: boolean
  categories: Category[]
  tasks: UserTask[]
  selectedCategory: string

  init: () => Promise<void>
  reload: () => Promise<void>
  persist: () => void

  completeOnboarding: (profile: UserProfile, workIds: string[]) => void
  resetOnboarding: () => void

  tasksForCategory: () => UserTask[]
  toggleComplete: (id: string) => void
  addTask: (input: NewTaskInput) => void
  updateTask: (id: string, patch: Partial<UserTask>) => void
  deleteTask: (id: string) => void
  changeMonth: (id: string, month: number | null) => void
  togglePinToWidget: (id: string) => void
  setSelectedCategory: (id: string) => void
}

export const useTaskStore = create<TaskState>((set, get) => ({
  loaded: false,
  onboarded: false,
  categories: [],
  tasks: [],
  selectedCategory: '',

  // 시드하지 않는다. 온보딩 완료 시점에만 categories/tasks를 생성한다.
  init: async () => {
    const db = await window.api.loadDb()
    const categories = (db.categories as Category[]) ?? []
    const tasks = (db.user_tasks as UserTask[]) ?? []
    const settings = (db.settings as Record<string, unknown>) ?? {}
    const selectedCategory = (settings.selectedCategory as string) ?? categories[0]?.id ?? ''
    // 마이그레이션: 기존 데이터 보유자는 온보딩을 다시 거치지 않는다.
    const onboarded = (settings.onboarded as boolean) ?? tasks.length > 0
    set({ loaded: true, onboarded, categories, tasks, selectedCategory })
  },

  // 시드 없이 DB에서 다시 읽어 반영한다(대시보드 창 초기화 / 다른 창의 변경 동기화).
  reload: async () => {
    const db = await window.api.loadDb()
    const categories = (db.categories as Category[]) ?? []
    const tasks = (db.user_tasks as UserTask[]) ?? []
    const settings = (db.settings as Record<string, unknown>) ?? {}
    const selectedCategory = (settings.selectedCategory as string) ?? categories[0]?.id ?? ''
    const onboarded = (settings.onboarded as boolean) ?? tasks.length > 0
    set({ loaded: true, onboarded, categories, tasks, selectedCategory })
  },

  persist: () => {
    const { categories, tasks, selectedCategory } = get()
    window.api.saveDb({
      categories,
      user_tasks: tasks,
      settings: { selectedCategory }
    })
  },

  // 온보딩 완료: 선택한(사용 가능) 업무로 카테고리/점검 항목을 생성하고 저장한다.
  completeOnboarding: (profile, workIds) => {
    const selected = workIds
      .map((id) => createWorkInstanceFromTemplate(id))
      .filter((result) => result.ok && result.item && result.detail)
    const categories = selected.map((result) => buildCategory(result.item as TemplateIndexItem))
    const tasks = selected.flatMap((result) => buildTasksForTemplate(result.detail as DetailedTemplate))
    const selectedCategory = selected[0]?.item?.templateId ?? ''
    set({ categories, tasks, selectedCategory, onboarded: true, loaded: true })
    window.api.saveDb({
      categories,
      user_tasks: tasks,
      settings: { onboarded: true, profile, selectedCategory }
    })
  },

  // 초기설정 다시하기(테스트/재설정).
  resetOnboarding: () => {
    set({ categories: [], tasks: [], selectedCategory: '', onboarded: false })
    window.api.saveDb({
      categories: [],
      user_tasks: [],
      settings: { onboarded: false, selectedCategory: '' }
    })
  },

  tasksForCategory: () => {
    const { tasks, selectedCategory } = get()
    return tasks.filter((t) => t.categoryId === selectedCategory)
  },

  toggleComplete: (id) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== id) return t
        const completed = t.status === 'completed'
        return {
          ...t,
          status: completed ? 'pending' : 'completed',
          completedAt: completed ? null : nowIso(),
          updatedAt: nowIso()
        }
      })
    }))
    get().persist()
  },

  addTask: (input) => {
    const ts = nowIso()
    const maxOrder = get().tasks.reduce((m, t) => Math.max(m, t.sortOrder), 0)
    const task: UserTask = {
      id: genId(),
      templateId: null,
      categoryId: input.categoryId,
      title: input.title.trim(),
      description: input.description.trim(),
      month: input.periodType === 'always' ? null : input.month,
      day: null,
      periodType: input.periodType,
      priority: input.priority,
      status: 'pending',
      evidenceMemo: input.evidenceMemo.trim(),
      note: input.note.trim(),
      completedAt: null,
      pinnedToWidget: false,
      createdAt: ts,
      updatedAt: ts,
      sortOrder: maxOrder + 1
    }
    set((state) => ({ tasks: [...state.tasks, task] }))
    get().persist()
  },

  updateTask: (id, patch) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowIso() } : t))
    }))
    get().persist()
  },

  deleteTask: (id) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
    get().persist()
  },

  changeMonth: (id, month) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              month,
              periodType: month == null ? 'always' : 'monthly',
              updatedAt: nowIso()
            }
          : t
      )
    }))
    get().persist()
  },

  togglePinToWidget: (id) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, pinnedToWidget: !t.pinnedToWidget, updatedAt: nowIso() } : t
      )
    }))
    get().persist()
  },

  setSelectedCategory: (id) => {
    set({ selectedCategory: id })
    get().persist()
  }
}))
