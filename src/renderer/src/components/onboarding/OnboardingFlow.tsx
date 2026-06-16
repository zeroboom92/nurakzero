import { useEffect, useRef, useState } from 'react'
import type { UserProfile } from '@/types'
import { useTaskStore } from '@/stores/taskStore'
import { StepStart } from './StepStart'
import { StepBasicInfo } from './StepBasicInfo'
import { StepWorkSelect } from './StepWorkSelect'
import { StepConfirm } from './StepConfirm'
import { StepDone } from './StepDone'

/** 3월 이전이면 직전 학년도를 기본값으로. */
function currentSchoolYear(): number {
  const now = new Date()
  return now.getMonth() + 1 < 3 ? now.getFullYear() - 1 : now.getFullYear()
}

const DEFAULT_PROFILE: UserProfile = {
  userName: '',
  educationOffice: '전북특별자치도교육청',
  schoolLevel: '초등학교',
  schoolYear: currentSchoolYear(),
  startMonth: 3,
  schoolName: '',
  hasKindergarten: false
}

/**
 * 초기 세팅(온보딩) 흐름.
 * 시작 → 기본정보 → 업무선택 → 생성확인 → 완료.
 * 완료 시 taskStore.completeOnboarding으로 categories/user_tasks를 생성하면
 * App이 위젯 화면으로 전환된다.
 */
export function OnboardingFlow(): JSX.Element {
  const completeOnboarding = useTaskStore((s) => s.completeOnboarding)
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [selectedWorkIds, setSelectedWorkIds] = useState<string[]>([])
  const cardRef = useRef<HTMLDivElement>(null)
  const roRef = useRef<ResizeObserver | null>(null)

  // 온보딩 동안 창을 키운다.
  useEffect(() => {
    window.api.setOnboarding(true)
  }, [])

  // 카드 내용 높이에 맞춰 창 높이를 자동 조절(화면/검색/단계 변화에 모두 반응).
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const apply = (): void => {
      window.api.setOnboardingHeight(el.offsetHeight + 28)
    }
    apply()
    const ro = new ResizeObserver(apply)
    roRef.current = ro
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const finalize = (openDashboard: boolean): void => {
    roRef.current?.disconnect() // 위젯 크기로 복귀하는 동안 높이 조절이 끼어들지 않도록
    completeOnboarding(profile, selectedWorkIds)
    window.api.setOnboarding(false)
    if (openDashboard) window.api.openDashboard()
    // completeOnboarding이 onboarded=true로 만들면 App이 위젯으로 전환된다.
  }

  return (
    <div className="onboarding">
      <div className="ob-card" ref={cardRef}>
        <div className="ob-wincontrols">
          <button
            type="button"
            className="ob-winbtn"
            onClick={() => window.api.minimize()}
            title="최소화"
            aria-label="최소화"
          >
            ─
          </button>
          <button
            type="button"
            className="ob-winbtn ob-winbtn--close"
            onClick={() => window.api.closeWindow()}
            title="닫기"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {step === 0 && <StepStart onNext={() => setStep(1)} />}
        {step === 1 && (
          <StepBasicInfo
            profile={profile}
            onChange={setProfile}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepWorkSelect
            selectedWorkIds={selectedWorkIds}
            onChange={setSelectedWorkIds}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepConfirm
            selectedWorkIds={selectedWorkIds}
            onBack={() => setStep(2)}
            onStart={() => setStep(4)}
            onEditInDashboard={() => finalize(true)}
          />
        )}
        {step === 4 && <StepDone profile={profile} onOpenWidget={() => finalize(false)} />}
      </div>
    </div>
  )
}
