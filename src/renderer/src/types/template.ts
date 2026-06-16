export type SchoolLevel = '유' | '초' | '중' | '고' | '특'

export type TemplateStatus = 'ready' | 'indexOnly' | 'deprecated'

export interface TemplateIndexItem {
  templateId: string
  version: string
  title: string
  displayTitle: string
  auditDomain: string
  category: string
  auditCode: string
  schoolLevels: SchoolLevel[]
  conditionalSchoolLevels: SchoolLevel[]
  aliases: string[]
  tags: string[]
  file: string
  templateStatus: TemplateStatus
}

export interface TemplateIndex {
  schemaVersion: string
  datasetId: string
  title: string
  description: string
  source: {
    documentTitle: string
    domain: string
    note: string
  }
  items: TemplateIndexItem[]
}

export interface DetailedTemplateTask {
  templateTaskId: string
  title: string
  shortTitle?: string
  description: string
  taskType?: string
  cycle?: string
  recommendedMonth: number | null
  recommendedDay?: number | null
  priority: 'high' | 'medium' | 'low'
  riskLevel?: string
  isCore?: boolean
  isAuditFocus?: boolean
  defaultStatus?: string
  checkQuestions?: string[]
  evidence: string[]
  completionCriteria?: string
  sourceBasis?: string
  monthReason?: string
}

export interface DetailedTemplate {
  templateId: string
  version: string
  schemaVersion: string
  title: string
  displayTitle: string
  description: string
  audit: {
    domain: string
    areaCode: string
    areaName: string
    itemCode: string
    itemName: string
  }
  schoolLevels: SchoolLevel[]
  aliases: string[]
  source: {
    documentTitle: string
    section: string
    sourceType: string
    note: string
  }
  legalReferences: string[]
  tasks: DetailedTemplateTask[]
}
