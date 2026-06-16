interface Props {
  onNext: () => void
}

export function StepStart({ onNext }: Props): JSX.Element {
  return (
    <div className="ob-step ob-step--center">
      <div className="ob-logo">🌿</div>
      <h1 className="ob-title">누락제로</h1>
      <p className="ob-lead">학교 업무, 놓치지 않도록 도와드립니다.</p>
      <button className="btn btn--primary ob-cta" onClick={onNext}>
        시작하기
      </button>
    </div>
  )
}
