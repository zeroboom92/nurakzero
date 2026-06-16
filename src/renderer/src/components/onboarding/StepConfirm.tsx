import { createWorkInstanceFromTemplate } from '@/services/templateService'
import type { DetailedTemplateTask } from '@/types/template'
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
  const selected = selectedWorkIds
    .map((id) => createWorkInstanceFromTemplate(id))
    .filter((result) => result.ok && result.detail)

  return (
    <div className="ob-step">
      <h2 className="ob-step__title">생성할 점검표 확인</h2>
      <p className="ob-step__desc">
        준비 완료 상태인 업무만 실제 사용자 점검표로 생성됩니다.
      </p>

      <div className="ob-preview">
        <div className="ob-preview__inner">
          {selected.length === 0 && (
            <div className="ob-empty ob-empty--panel">
              아직 선택 가능한 세부 점검표 템플릿이 없습니다.
              <br />
              온보딩은 완료할 수 있고, 템플릿이 준비되면 업무 선택 흐름에 연결됩니다.
            </div>
          )}

          {selected.map((result) => {
            const detail = result.detail
            if (!detail) return null
            const byMonth = MONTHS.map((month) => ({
              month,
              items: detail.tasks.filter((item) => item.recommendedMonth === month)
            })).filter((group) => group.items.length > 0)
            const always = detail.tasks.filter((item) => item.recommendedMonth == null)

            return (
              <div key={detail.templateId} className="ob-preview__work">
                <h3 className="ob-preview__title">{detail.displayTitle}</h3>
                {byMonth.map((group) => (
                  <div key={group.month} className="ob-preview__group">
                    <span className="ob-preview__month">{monthLabel(group.month)}</span>
                    <ul>
                      {group.items.map((item: DetailedTemplateTask) => (
                        <li key={item.title}>{item.title}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                {always.length > 0 && (
                  <div className="ob-preview__group">
                    <span className="ob-preview__month">수시</span>
                    <ul>
                      {always.map((item) => (
                        <li key={item.title}>{item.title}</li>
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
