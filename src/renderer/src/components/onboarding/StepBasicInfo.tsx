import type { SchoolLevel, UserProfile } from '@/types'

interface Props {
  profile: UserProfile
  onChange: (p: UserProfile) => void
  onBack: () => void
  onNext: () => void
}

const LEVELS: SchoolLevel[] = ['유치원', '초등학교', '중학교', '고등학교', '특수학교']
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

// 1차에서는 전북특별자치도교육청만 선택 가능, 나머지는 준비 중.
const AVAILABLE_OFFICE = '전북특별자치도교육청'
const COMING_OFFICES = [
  '서울특별시교육청',
  '부산광역시교육청',
  '대구광역시교육청',
  '인천광역시교육청',
  '광주광역시교육청',
  '대전광역시교육청',
  '울산광역시교육청',
  '세종특별자치시교육청',
  '경기도교육청',
  '강원특별자치도교육청',
  '충청북도교육청',
  '충청남도교육청',
  '전라남도교육청',
  '경상북도교육청',
  '경상남도교육청',
  '제주특별자치도교육청'
]

export function StepBasicInfo({ profile, onChange, onBack, onNext }: Props): JSX.Element {
  const set = <K extends keyof UserProfile>(key: K, value: UserProfile[K]): void =>
    onChange({ ...profile, [key]: value })

  const valid = !!profile.schoolLevel && Number.isFinite(profile.schoolYear)

  return (
    <div className="ob-step">
      <h2 className="ob-step__title">기본 정보</h2>
      <p className="ob-step__desc">점검표 생성에 필요한 최소 정보만 입력하세요.</p>

      <div className="ob-form">
        <label className="field">
          <span className="field__label">이름</span>
          <input
            className="field__input"
            value={profile.userName}
            onChange={(e) => set('userName', e.target.value)}
            placeholder="예) 온영범"
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field__label">학교급 *</span>
            <select
              className="field__input"
              value={profile.schoolLevel}
              onChange={(e) => set('schoolLevel', e.target.value as SchoolLevel)}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">기준연도 *</span>
            <input
              className="field__input"
              type="number"
              value={profile.schoolYear}
              onChange={(e) => set('schoolYear', Number(e.target.value))}
            />
          </label>

          <label className="field">
            <span className="field__label">학기 시작 월</span>
            <select
              className="field__input"
              value={profile.startMonth}
              onChange={(e) => set('startMonth', Number(e.target.value))}
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span className="field__label">교육청 *</span>
            <select
              className="field__input"
              value={profile.educationOffice}
              onChange={(e) => set('educationOffice', e.target.value)}
            >
              <option value={AVAILABLE_OFFICE}>{AVAILABLE_OFFICE}</option>
              {COMING_OFFICES.map((o) => (
                <option key={o} value={o} disabled>
                  {o} (준비 중)
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">학교명</span>
            <input
              className="field__input"
              value={profile.schoolName ?? ''}
              onChange={(e) => set('schoolName', e.target.value)}
              placeholder="선택"
            />
          </label>
        </div>

        <label className="ob-check">
          <input
            type="checkbox"
            checked={!!profile.hasKindergarten}
            onChange={(e) => set('hasKindergarten', e.target.checked)}
          />
          <span>병설유치원 있음</span>
        </label>
      </div>

      <div className="ob-actions ob-actions--spread">
        <p className="ob-note ob-note--inline">
          🔒 입력 내용은 이 컴퓨터에만 저장되며,
          <br />
          서버로 전송되지 않습니다.
        </p>
        <div className="ob-actions__btns">
          <button className="btn btn--ghost" onClick={onBack}>
            이전
          </button>
          <button className="btn btn--primary" onClick={onNext} disabled={!valid}>
            다음
          </button>
        </div>
      </div>
    </div>
  )
}
