import templateIndexData from '@/data/templates/index.json'
import type {
  DetailedTemplate,
  SchoolLevel as TemplateSchoolLevel,
  TemplateIndex,
  TemplateIndexItem
} from '@/types/template'
import type { SchoolLevel as ProfileSchoolLevel } from '@/types'

const EMPTY_INDEX: TemplateIndex = {
  schemaVersion: '1.0.0',
  datasetId: 'nurakzero-audit-template-index',
  title: '누락제로 표준 업무 템플릿 인덱스',
  description: '표준 업무 템플릿 인덱스를 불러오지 못했습니다.',
  source: {
    documentTitle: '',
    domain: '',
    note: ''
  },
  items: []
}

const templateModules = import.meta.glob<unknown>('@/data/templates/*.v1.json', {
  eager: true,
  import: 'default'
})

export interface CreateWorkInstanceResult {
  ok: boolean
  item: TemplateIndexItem | null
  detail: DetailedTemplate | null
  message: string
}

function isTemplateIndex(value: unknown): value is TemplateIndex {
  if (!value || typeof value !== 'object') return false
  const maybe = value as Partial<TemplateIndex>
  return Array.isArray(maybe.items)
}

function isDetailedTemplate(value: unknown): value is DetailedTemplate {
  if (!value || typeof value !== 'object') return false
  const maybe = value as Partial<DetailedTemplate>
  return typeof maybe.templateId === 'string' && Array.isArray(maybe.tasks)
}

const DETAIL_TEMPLATES: Record<string, DetailedTemplate> = Object.values(templateModules).reduce<
  Record<string, DetailedTemplate>
>((templates, moduleValue) => {
  if (isDetailedTemplate(moduleValue)) {
    templates[moduleValue.templateId] = moduleValue
  }
  return templates
}, {})

function normalizeText(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/g, '')
}

function normalizeLoose(value: string): string {
  return normalizeText(value).replace(/[^\p{Letter}\p{Number}]/gu, '')
}

function searchableText(item: TemplateIndexItem): string {
  return [
    item.title,
    item.displayTitle,
    item.category,
    item.auditCode,
    ...item.aliases,
    ...item.tags
  ].join(' ')
}

function matchesQuery(item: TemplateIndexItem, query: string): boolean {
  const needle = normalizeText(query)
  if (!needle) return true

  const haystack = normalizeText(searchableText(item))
  if (haystack.includes(needle)) return true

  const looseNeedle = normalizeLoose(query)
  return !!looseNeedle && normalizeLoose(searchableText(item)).includes(looseNeedle)
}

export function toTemplateSchoolLevel(
  schoolLevel?: ProfileSchoolLevel | TemplateSchoolLevel
): TemplateSchoolLevel | undefined {
  if (!schoolLevel) return undefined

  const level = String(schoolLevel)
  if (level === '유' || level.includes('유치원')) return '유'
  if (level === '초' || level.includes('초등')) return '초'
  if (level === '중' || level.includes('중학')) return '중'
  if (level === '고' || level.includes('고등')) return '고'
  if (level === '특' || level.includes('특수')) return '특'

  return undefined
}

export function loadTemplateIndex(): TemplateIndex {
  return isTemplateIndex(templateIndexData) ? (templateIndexData as TemplateIndex) : EMPTY_INDEX
}

export function loadTemplateDetail(templateId: string): DetailedTemplate | null {
  return DETAIL_TEMPLATES[templateId] ?? null
}

export function filterTemplatesBySchoolLevel(
  items: TemplateIndexItem[],
  schoolLevel?: TemplateSchoolLevel
): TemplateIndexItem[] {
  if (!schoolLevel) return items
  return items.filter(
    (item) =>
      item.schoolLevels.includes(schoolLevel) || item.conditionalSchoolLevels.includes(schoolLevel)
  )
}

export function searchTemplates(
  query: string,
  schoolLevel?: TemplateSchoolLevel
): TemplateIndexItem[] {
  const index = loadTemplateIndex()
  const filtered = filterTemplatesBySchoolLevel(index.items, schoolLevel)
  return filtered.filter((item) => matchesQuery(item, query))
}

export function isConditionalForSchoolLevel(
  item: TemplateIndexItem,
  schoolLevel?: TemplateSchoolLevel
): boolean {
  return !!schoolLevel && item.conditionalSchoolLevels.includes(schoolLevel)
}

export function createWorkInstanceFromTemplate(templateId: string): CreateWorkInstanceResult {
  const item = loadTemplateIndex().items.find((template) => template.templateId === templateId) ?? null

  if (!item) {
    return {
      ok: false,
      item,
      detail: null,
      message: '선택한 업무 템플릿을 찾을 수 없습니다.'
    }
  }

  if (item.templateStatus !== 'ready') {
    return {
      ok: false,
      item,
      detail: null,
      message: '이 업무는 인덱스만 등록되어 있습니다. 세부 점검표 템플릿이 준비되면 선택할 수 있습니다.'
    }
  }

  const detail = loadTemplateDetail(templateId)
  if (!detail) {
    return {
      ok: false,
      item,
      detail: null,
      message: '세부 점검표 템플릿 파일을 찾을 수 없습니다.'
    }
  }

  return {
    ok: true,
    item,
    detail,
    message: '세부 템플릿 준비가 확인되었습니다.'
  }
}
