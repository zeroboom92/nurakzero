import type { PeriodType, Priority } from '@/types'

/**
 * 표준 업무 템플릿 데이터.
 *
 * 교사가 업무를 "선택"하면 이 데이터에서 점검 항목이 자동 생성된다.
 * 1차 버전은 개인정보 보호만 실제 점검표를 완성하고(available: true),
 * 나머지 업무는 목록·별칭만 두고 "준비 중"(available: false, 선택 불가)으로 노출한다.
 * 실제 감사 점검 항목은 공식 매뉴얼 출처가 확보되는 대로 채운다.
 */

export interface WorkItemTemplate {
  title: string
  description: string
  defaultMonth: number | null // 월별이면 1~12, 수시면 null
  periodType: PeriodType
  priority: Priority
  evidence: string // 기존 UserTask.evidenceMemo(문자열)에 그대로 매핑
}

export interface WorkTemplate {
  id: string // 'privacy_protection' — 생성될 Category.id 로도 사용
  title: string
  category: string
  auditCode?: string
  aliases: string[]
  schoolLevels: string[] // ['유','초','중','고','특'] (1차에선 표시용)
  available: boolean // true=점검표 완성, false=준비 중(선택 불가)
  items: WorkItemTemplate[]
}

const PRIVACY_ITEMS: WorkItemTemplate[] = [
  {
    title: '개인정보 보호 계획 수립',
    description: '학교 개인정보 보호 업무 추진 계획을 수립하고 내부결재 여부를 확인한다.',
    defaultMonth: 3,
    periodType: 'monthly',
    priority: 'high',
    evidence: '개인정보 보호 계획 문서'
  },
  {
    title: '개인정보 처리방침 현행화',
    description: '학교 홈페이지 개인정보 처리방침이 최신 내용으로 게시되어 있는지 확인한다.',
    defaultMonth: 3,
    periodType: 'monthly',
    priority: 'high',
    evidence: '학교 홈페이지 개인정보 처리방침'
  },
  {
    title: '개인정보 취급자 지정 및 현행화',
    description: '개인정보 취급자 지정 현황을 점검하고 인사이동에 따라 갱신한다.',
    defaultMonth: 3,
    periodType: 'monthly',
    priority: 'medium',
    evidence: '개인정보 취급자 지정 내부결재'
  },
  {
    title: '개인정보 취급자 교육 실시',
    description: '개인정보 취급자를 대상으로 개인정보보호 교육을 실시하고 결과를 보관한다.',
    defaultMonth: 4,
    periodType: 'monthly',
    priority: 'medium',
    evidence: '교육 결과 등록부 또는 내부결재'
  },
  {
    title: '개인정보 파일 현황 점검',
    description: '보유 중인 개인정보 파일 현황을 점검하고 불필요한 파일을 파기한다.',
    defaultMonth: 5,
    periodType: 'monthly',
    priority: 'medium',
    evidence: '개인정보 파일 현황표'
  },
  {
    title: '개인정보 처리 위탁 점검',
    description: '외부 위탁 업체의 개인정보 처리 현황과 계약서를 점검한다.',
    defaultMonth: 6,
    periodType: 'monthly',
    priority: 'medium',
    evidence: '위탁 계약서 및 점검표'
  },
  {
    title: '개인정보 안전성 확보조치 점검',
    description: '접근권한 관리, 접속기록 보관 등 안전성 확보조치 이행 여부를 점검한다.',
    defaultMonth: 9,
    periodType: 'monthly',
    priority: 'high',
    evidence: '안전성 확보조치 점검표'
  },
  {
    title: '개인정보 보호 자체 점검 실시',
    description: '연간 개인정보 보호 자체 점검을 실시하고 결과를 보고한다.',
    defaultMonth: 11,
    periodType: 'monthly',
    priority: 'high',
    evidence: '자체 점검 결과 보고서'
  },
  {
    title: '홈페이지 게시자료 개인정보 점검',
    description: '학교 홈페이지 게시물에 개인정보가 포함되어 있지 않은지 점검한다.',
    defaultMonth: null,
    periodType: 'always',
    priority: 'medium',
    evidence: '점검 결과 메모'
  },
  {
    title: '개인정보 유출 사고 대응 점검',
    description: '개인정보 유출 사고 발생 시 대응 절차와 신고 체계를 수시로 점검한다.',
    defaultMonth: null,
    periodType: 'always',
    priority: 'high',
    evidence: '사고 대응 매뉴얼'
  }
]

const ALL_LEVELS = ['유', '초', '중', '고', '특']

/** 준비 중 업무(목록·별칭만). 1차에서는 선택 불가. */
function comingSoon(
  id: string,
  title: string,
  category: string,
  aliases: string[]
): WorkTemplate {
  return { id, title, category, aliases, schoolLevels: ALL_LEVELS, available: false, items: [] }
}

export const WORK_TEMPLATES: WorkTemplate[] = [
  {
    id: 'privacy_protection',
    title: '개인정보 보호',
    category: '과학·직업교육 및 정보보호',
    auditCode: '6-3',
    aliases: ['개인정보', '개인정보보호', '정보보호', '정보보안', '교육정보', '정보업무'],
    schoolLevels: ALL_LEVELS,
    available: true,
    items: PRIVACY_ITEMS
  },
  comingSoon('information_security', '정보보안', '과학·직업교육 및 정보보호', [
    '정보보안',
    '보안',
    '사이버',
    '망분리'
  ]),
  comingSoon('science_education', '과학교육', '과학·직업교육 및 정보보호', [
    '과학',
    '과학실',
    '실험실안전'
  ]),
  comingSoon('field_trip', '현장체험학습', '교육과정', ['체험학습', '수학여행', '현장학습']),
  comingSoon('school_violence', '학교폭력', '학생생활', ['학폭', '학교폭력', '폭력예방']),
  comingSoon('student_life', '학생생활교육', '학생생활', ['생활지도', '생활교육', '인성']),
  comingSoon('attendance', '출결 관리', '교무·학사', ['출결', '결석', '출석']),
  comingSoon('student_record', '학교생활기록부', '교무·학사', ['생기부', '학생부', '나이스']),
  comingSoon('after_school', '방과후학교', '교육과정', ['방과후', '돌봄', '늘봄']),
  comingSoon('library', '학교도서관', '교육과정', ['도서관', '독서', '사서'])
]

export const AVAILABLE_WORK_IDS = WORK_TEMPLATES.filter((w) => w.available).map((w) => w.id)
