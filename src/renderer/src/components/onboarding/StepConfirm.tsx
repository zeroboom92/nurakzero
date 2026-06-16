import { WORK_TEMPLATES, type WorkItemTemplate } from '@/data/workTemplates'
import { monthLabel } from '@/utils/dateUtils'

interface Props {
  selectedWorkIds: string[]
  onBack: () => void
  onStart: () => void
  onEditInDashboard: () => void
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export function StepConfirm({
  selectedWorkIds,
  onBack,
  onStart,
  onEditInDashboard
}: Props): JSX.Element {
  const selected = WORK_TEMPLATES.filter(
    (w) => selectedWorkIds.includes(w.id) && w.available
  )

  return (
    <div className="ob-step">
      <h2 className="ob-step__title">생성될 점검표 확인</h2>
      <p className="ob-step__desc">선택한 업무에서 아래 점검 항목이 만들어집니다.</p>

      <div className="ob-preview">
        <div className="ob-preview__inner">
        {selected.map((work) => {
          const byMonth = MONTHS.map((m) => ({
            month: m,
            items: work.items.filter((i) => i.periodType === 'monthly' && i.defaultMonth === m)
          })).filter((g) => g.items.length > 0)
          const always = work.items.filter((i) => i.periodType === 'always')

          return (
            <div key={work.id} className="ob-preview__work">
              <h3 className="ob-preview__title">{work.title}</h3>
              {byMonth.map((g) => (
                <div key={g.month} className="ob-preview__group">
                  <span className="ob-preview__month">{monthLabel(g.month)}</span>
                  <ul>
                    {g.items.map((i: WorkItemTemplate) => (
                      <li key={i.title}>{i.title}</li>
                    ))}
                  </ul>
                </div>
              ))}
              {always.length > 0 && (
                <div className="ob-preview__group">
                  <span className="ob-preview__month">수시</span>
                  <ul>
                    {always.map((i) => (
                      <li key={i.title}>{i.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
        </div>
      </div>

      <div className="ob-actions ob-actions--confirm">
        <button className="btn btn--ghost" onClick={onBack}>
          이전
        </button>
        <button className="btn btn--soft" onClick={onEditInDashboard}>
          대시보드에서 수정
        </button>
        <button className="btn btn--primary" onClick={onStart}>
          기본값으로 시작
        </button>
      </div>
    </div>
  )
}
