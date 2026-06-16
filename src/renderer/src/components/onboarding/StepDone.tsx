import type { UserProfile } from '@/types'
import { currentMonth, currentYear, monthLabel } from '@/utils/dateUtils'

interface Props {
  profile: UserProfile
  onOpenWidget: () => void
}

export function StepDone({ profile, onOpenWidget }: Props): JSX.Element {
  return (
    <div className="ob-step ob-step--center">
      <div className="ob-logo">🎉</div>
      <h2 className="ob-title ob-title--sm">설정이 완료되었습니다</h2>
      <p className="ob-lead">
        {currentYear()}년 {monthLabel(currentMonth())} 점검표를 시작합니다.
        {profile.userName && ` ${profile.userName} 선생님, 화이팅!`}
      </p>
      <button className="btn btn--primary ob-cta" onClick={onOpenWidget}>
        위젯 열기
      </button>
    </div>
  )
}
