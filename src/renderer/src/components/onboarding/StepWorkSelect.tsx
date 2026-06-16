import { useState } from 'react'
import { WORK_TEMPLATES } from '@/data/workTemplates'

interface Props {
  selectedWorkIds: string[]
  onChange: (ids: string[]) => void
  onBack: () => void
  onNext: () => void
}

export function StepWorkSelect({ selectedWorkIds, onChange, onBack, onNext }: Props): JSX.Element {
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const works = WORK_TEMPLATES.filter((w) => {
    if (!q) return true
    return (
      w.title.toLowerCase().includes(q) || w.aliases.some((a) => a.toLowerCase().includes(q))
    )
  })

  const toggle = (id: string): void => {
    if (selectedWorkIds.includes(id)) onChange(selectedWorkIds.filter((x) => x !== id))
    else onChange([...selectedWorkIds, id])
  }

  return (
    <div className="ob-step">
      <h2 className="ob-step__title">맡은 업무를 선택하세요</h2>
      <p className="ob-step__desc">선택한 업무의 점검 항목이 자동으로 만들어집니다.</p>

      <input
        className="field__input ob-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="검색: 개인정보, 정보, 보안 …"
      />

      <div className="ob-work-list">
        {works.map((w) => {
          const checked = selectedWorkIds.includes(w.id)
          return (
            <button
              key={w.id}
              type="button"
              className={`ob-work ${checked ? 'ob-work--on' : ''} ${
                !w.available ? 'ob-work--soon' : ''
              }`}
              onClick={() => w.available && toggle(w.id)}
              disabled={!w.available}
            >
              <span className={`ob-work__box ${checked ? 'ob-work__box--on' : ''}`}>
                {checked ? '✓' : ''}
              </span>
              <span className="ob-work__title">{w.title}</span>
              {!w.available && <span className="ob-work__soon">준비 중</span>}
            </button>
          )
        })}
        {works.length === 0 && <div className="ob-empty">검색 결과가 없습니다.</div>}
      </div>

      <div className="ob-actions">
        <button className="btn btn--ghost" onClick={onBack}>
          이전
        </button>
        <button className="btn btn--primary" onClick={onNext} disabled={selectedWorkIds.length === 0}>
          다음
        </button>
      </div>
    </div>
  )
}
