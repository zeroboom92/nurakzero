#!/usr/bin/env node
/**
 * 누락제로 표준 업무 템플릿 품질 검증기 (자동 검문소)
 *
 * 사용:  node scripts/validate-templates.mjs            # 전체 검사
 *        node scripts/validate-templates.mjs <id..>     # 특정 templateId만
 *
 * 스키마(형식)뿐 아니라 "내용 품질"까지 검사한다.
 * ERROR가 하나라도 있으면 종료코드 1 (CI/커밋 전 차단용).
 * 골든 샘플: privacy_protection.v1.json
 */
import { readFileSync, readdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = join(ROOT, 'src', 'renderer', 'src', 'data', 'templates')

// ---- 품질 기준 ----
const MAX_TASKS_ERROR = 15 // 업무당 점검항목 상한(초과=원문 통째 복붙 신호)
const MAX_TASKS_WARN = 12
const TITLE_MAX = 40 // 제목 길이(초과=원문 조각 신호)
const MONTH_SKEW_RATIO = 0.6 // 한 달에 N% 이상 몰리면 월배정 편중
const BOILERPLATE = /영역의?\s*세부\s*점검내용을\s*확인하고\s*관련\s*증빙서류를\s*정리한다/
const VALID_PRIORITY = new Set(['high', 'medium', 'low'])

const onlyIds = process.argv.slice(2)

const detailFiles = readdirSync(DIR).filter((f) => f.endsWith('.v1.json'))
const index = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf8'))
const indexById = new Map(index.items.map((it) => [it.templateId, it]))

let totalErr = 0
let totalWarn = 0
const lines = []

function uniq(arr) {
  return new Set(arr.map((x) => JSON.stringify(x)))
}

function checkTemplate(file) {
  const errs = []
  const warns = []
  let data
  try {
    data = JSON.parse(readFileSync(join(DIR, file), 'utf8'))
  } catch (e) {
    return { id: file, errs: [`JSON 파싱 실패: ${e.message}`], warns: [] }
  }
  const id = data.templateId || file

  // ---- 인덱스 정합성 ----
  const idx = indexById.get(id)
  if (!idx) errs.push(`인덱스(index.json)에 templateId '${id}' 없음`)
  else {
    const base = String(idx.file || '').split('/').pop()
    if (base && base !== file) warns.push(`인덱스 file('${idx.file}')과 실제 파일명(${file}) 불일치`)
    if (idx.templateStatus === 'ready' && (!Array.isArray(data.tasks) || data.tasks.length === 0))
      errs.push(`인덱스 status=ready 인데 tasks 비어있음`)
  }

  const tasks = Array.isArray(data.tasks) ? data.tasks : []
  if (tasks.length === 0) {
    errs.push('tasks 비어있음')
    return { id, errs, warns }
  }

  // ---- task 수 ----
  if (tasks.length > MAX_TASKS_ERROR)
    errs.push(`점검항목 ${tasks.length}개 (상한 ${MAX_TASKS_ERROR}). 원문을 큐레이션하지 않고 통째로 쪼갠 것으로 보임`)
  else if (tasks.length > MAX_TASKS_WARN) warns.push(`점검항목 ${tasks.length}개 (권장 ≤ ${MAX_TASKS_WARN})`)

  // ---- evidence 복붙(전체/과반 동일) ----
  if (tasks.length > 1) {
    const evCounts = {}
    tasks.forEach((t) => {
      const k = JSON.stringify(t.evidence || [])
      evCounts[k] = (evCounts[k] || 0) + 1
    })
    const topEv = Math.max(...Object.values(evCounts))
    if (topEv === tasks.length) errs.push('모든 task의 evidence가 동일(증빙 복붙)')
    else if (tasks.length >= 4 && topEv >= tasks.length * 0.7)
      errs.push(`evidence가 과반 동일(${topEv}/${tasks.length}) — 항목별 맞춤 증빙 필요`)
  }

  // ---- description 반복/보일러플레이트 ----
  const descSet = uniq(tasks.map((t) => t.description || ''))
  if (tasks.length >= 5 && descSet.size <= Math.max(2, Math.ceil(tasks.length * 0.2)))
    errs.push(`description이 사실상 반복(고유 ${descSet.size}종/${tasks.length}개) — 항목별 실제 점검내용 필요`)

  // 말미가 반복되는 리워드 보일러플레이트(상투구로 정규식만 피한 경우)
  if (tasks.length >= 5) {
    const tails = {}
    tasks.forEach((t) => {
      const tail = (t.description || '').slice(-18)
      if (tail) tails[tail] = (tails[tail] || 0) + 1
    })
    const topTail = Math.max(0, ...Object.values(tails))
    if (topTail >= Math.max(3, Math.ceil(tasks.length * 0.4)))
      errs.push(`description 말미가 반복(${topTail}/${tasks.length}) — 리워드된 보일러플레이트 의심`)
  }

  // ---- 월 배정 편중 ----
  const monthly = tasks.filter((t) => t.recommendedMonth != null)
  if (monthly.length >= 5) {
    const counts = {}
    monthly.forEach((t) => (counts[t.recommendedMonth] = (counts[t.recommendedMonth] || 0) + 1))
    const [m, c] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    if (c / monthly.length >= MONTH_SKEW_RATIO)
      warns.push(`월 배정 편중: ${m}월에 ${c}/${monthly.length} (기본값 남발 가능성)`)
  }

  // ---- richness 카운터 ----
  let noTitle = 0, badMonth = 0, badPriority = 0, badEvidence = 0
  let boiler = 0, longTitle = 0, fragTitle = 0, cutShort = 0, commaEvi = 0
  let noCheckQ = 0, noCompletion = 0, noMonthReason = 0, noSourceBasis = 0
  let ellipsis = 0, junkTitle = 0, brokenEvi = 0
  for (const t of tasks) {
    if (!t.title) noTitle++
    const m = t.recommendedMonth
    if (!(m === null || (Number.isInteger(m) && m >= 1 && m <= 12))) badMonth++
    if (!VALID_PRIORITY.has(t.priority)) badPriority++
    if (!Array.isArray(t.evidence) || t.evidence.length === 0) badEvidence++
    if (t.description && BOILERPLATE.test(t.description)) boiler++
    if (t.title && /…|\.\.\./.test(t.title)) ellipsis++
    if (t.title && /^\s*\d+\s*차(\s|$|확인)/.test(t.title)) junkTitle++
    if (
      Array.isArray(t.evidence) &&
      t.evidence.some(
        (e) => typeof e === 'string' && e.split('(').length - 1 !== e.split(')').length - 1
      )
    )
      brokenEvi++
    if (t.title && t.title.length > TITLE_MAX) longTitle++
    if (t.title && /\s-\s/.test(t.title) && t.title.length > 28) fragTitle++
    // 글자수 절단: shortTitle이 title의 앞부분이면서 '단어 중간'에서 잘린 경우만.
    // 다음 글자가 글자/숫자이면 단어 중간 절단(예: "…준수 여"+"부"), 공백·괄호 등 구두점이면 정상 경계로 본다.
    if (
      t.shortTitle &&
      t.title &&
      t.title.startsWith(t.shortTitle) &&
      t.shortTitle.length < t.title.length &&
      /[\p{L}\p{N}]/u.test(t.title.charAt(t.shortTitle.length))
    )
      cutShort++
    if (Array.isArray(t.evidence) && t.evidence.some((e) => typeof e === 'string' && /[)가-힣A-Za-z0-9]\s*,\s*[(가-힣A-Za-z0-9]/.test(e) && e.length > 12))
      commaEvi++
    if (!Array.isArray(t.checkQuestions) || t.checkQuestions.length === 0) noCheckQ++
    if (!t.completionCriteria) noCompletion++
    if (!t.monthReason) noMonthReason++
    if (!t.sourceBasis) noSourceBasis++
  }

  if (noTitle) errs.push(`title 없는 task ${noTitle}개`)
  if (badMonth) errs.push(`recommendedMonth 비정상 task ${badMonth}개`)
  if (badPriority) errs.push(`priority 비표준 task ${badPriority}개`)
  if (badEvidence) errs.push(`evidence 없음/배열아님 task ${badEvidence}개`)
  if (boiler) errs.push(`보일러플레이트 description("…영역의 세부 점검내용을…") ${boiler}개`)
  if (cutShort) errs.push(`shortTitle을 글자수로 자른 흔적(제목 앞부분 그대로) ${cutShort}개`)
  if (ellipsis) errs.push(`제목에 '…'(잘린 원문 조각) ${ellipsis}개`)
  if (junkTitle) errs.push(`'N차 확인' 류 의미없는 제목 ${junkTitle}개`)
  if (brokenEvi) errs.push(`evidence 괄호 깨짐(원문 분리 오류) ${brokenEvi}개`)

  if (longTitle) warns.push(`제목 ${TITLE_MAX}자 초과 ${longTitle}개(원문 조각 의심)`)
  if (fragTitle) warns.push(`제목에 '… - 원문…' 형태 ${fragTitle}개`)
  if (commaEvi) warns.push(`evidence 한 칸에 콤마로 합쳐진 항목 ${commaEvi}개(분리 필요)`)
  if (noCheckQ) warns.push(`checkQuestions 없는 task ${noCheckQ}개`)
  if (noCompletion) warns.push(`completionCriteria 없는 task ${noCompletion}개`)
  if (noMonthReason) warns.push(`monthReason 없는 task ${noMonthReason}개`)
  if (noSourceBasis) warns.push(`sourceBasis 없는 task ${noSourceBasis}개`)

  return { id, errs, warns, count: tasks.length }
}

let targets = detailFiles
if (onlyIds.length) targets = detailFiles.filter((f) => onlyIds.some((id) => f.startsWith(id)))

const results = targets.map(checkTemplate).sort((a, b) => b.errs.length - a.errs.length)

for (const r of results) {
  const mark = r.errs.length ? '✗' : r.warns.length ? '△' : '✓'
  lines.push(`\n${mark} ${r.id}  (task ${r.count ?? '-'})`)
  r.errs.forEach((e) => lines.push(`    ✗ ERROR  ${e}`))
  r.warns.forEach((w) => lines.push(`    △ warn   ${w}`))
  totalErr += r.errs.length
  totalWarn += r.warns.length
}

console.log('================ 템플릿 품질 검증 ================')
console.log(lines.join('\n'))
console.log('\n--------------------------------------------------')
const pass = results.filter((r) => !r.errs.length && !r.warns.length).length
console.log(`템플릿 ${results.length}개 | 완전통과 ${pass} | ERROR ${totalErr} | warn ${totalWarn}`)
console.log(totalErr ? '❌ ERROR가 있어 적용 부적합. 위 항목을 수정하세요.' : '✅ ERROR 없음.')
process.exit(totalErr ? 1 : 0)
