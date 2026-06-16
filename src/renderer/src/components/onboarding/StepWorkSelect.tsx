import { useMemo, useState } from 'react'
import type { UserProfile } from '@/types'
import type { TemplateIndexItem } from '@/types/template'
import {
  createWorkInstanceFromTemplate,
  isConditionalForSchoolLevel,
  searchTemplates,
  toTemplateSchoolLevel
} from '@/services/templateService'

interface Props {
  profile: UserProfile
  selectedWorkIds: string[]
  onChange: (ids: string[]) => void
  onBack: () => void
  onNext: () => void
}

function groupByCategory(items: TemplateIndexItem[]): Array<[string, TemplateIndexItem[]]> {
  const groups = new Map<string, TemplateIndexItem[]>()
  items.forEach((item) => {
    const group = groups.get(item.category) ?? []
    group.push(item)
    groups.set(item.category, group)
  })
  return Array.from(groups.entries())
}

export function StepWorkSelect({
  profile,
  selectedWorkIds,
  onChange,
  onBack,
  onNext
}: Props): JSX.Element {
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const schoolLevel = toTemplateSchoolLevel(profile.schoolLevel)
  const works = useMemo(() => searchTemplates(query, schoolLevel), [query, schoolLevel])
  const groupedWorks = useMemo(() => groupByCategory(works), [works])
  const hasReadyTemplate = works.some((item) => item.templateStatus === 'ready')

  const toggle = (item: TemplateIndexItem): void => {
    const result = createWorkInstanceFromTemplate(item.templateId)

    if (!result.ok) {
      setNotice(result.message)
      return
    }

    setNotice('')
    if (selectedWorkIds.includes(item.templateId)) {
      onChange(selectedWorkIds.filter((id) => id !== item.templateId))
    } else {
      onChange([...selectedWorkIds, item.templateId])
    }
  }

  return (
    <div className="ob-step">
      <h2 className="ob-step__title">맞춤 업무를 선택하세요</h2>
      <p className="ob-step__desc">
        표준 감사 업무 인덱스에서 학교급에 맞는 업무를 찾습니다. 준비중 업무는 세부 점검표가
        등록되면 선택할 수 있습니다.
      </p>

      <input
        className="field__input ob-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="업무명, 별칭, 감사코드 검색: 개인정보, 학폭, 6-3"
      />

      {notice && <div className="ob-template-notice">{notice}</div>}

      <div className="ob-work-list">
        {groupedWorks.map(([category, items]) => (
          <section key={category} className="ob-work-group">
            <h3 className="ob-work-group__title">{category}</h3>
            {items.map((item) => {
              const checked = selectedWorkIds.includes(item.templateId)
              const isReady = item.templateStatus === 'ready'
              const conditional = isConditionalForSchoolLevel(item, schoolLevel)

              return (
                <button
                  key={item.templateId}
                  type="button"
                  className={`ob-work ${checked ? 'ob-work--on' : ''} ${
                    !isReady ? 'ob-work--soon' : ''
                  }`}
                  onClick={() => toggle(item)}
                >
                  <span className={`ob-work__box ${checked ? 'ob-work__box--on' : ''}`}>
                    {checked ? '✓' : ''}
                  </span>
                  <span className="ob-work__main">
                    <span className="ob-work__title">{item.displayTitle}</span>
                    <span className="ob-work__code">{item.auditCode}</span>
                    <span className="ob-work__levels">
                      {item.schoolLevels.map((lv) => (
                        <span key={lv} className="ob-level" data-lv={lv}>
                          {lv}
                        </span>
                      ))}
                    </span>
                  </span>
                  {conditional && <span className="ob-work__badge">조건부</span>}
                  {!isReady && <span className="ob-work__soon">준비중</span>}
                </button>
              )
            })}
          </section>
        ))}

        {works.length === 0 && (
          <div className="ob-empty">
            검색 결과가 없습니다.
            <br />
            다른 업무명이나 별칭으로 검색해보세요.
          </div>
        )}
      </div>

      <div className="ob-actions">
        <button className="btn btn--ghost" onClick={onBack}>
          이전
        </button>
        <button
          className="btn btn--primary"
          onClick={onNext}
          disabled={hasReadyTemplate && selectedWorkIds.length === 0}
        >
          {selectedWorkIds.length > 0 ? '다음' : '선택 없이 계속'}
        </button>
      </div>
    </div>
  )
}
