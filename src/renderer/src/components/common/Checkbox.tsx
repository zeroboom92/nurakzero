interface CheckboxProps {
  checked: boolean
  onChange: () => void
  label?: string
  variant?: 'default' | 'delay'
}

export function Checkbox({ checked, onChange, variant = 'default' }: CheckboxProps): JSX.Element {
  return (
    <button
      type="button"
      className={`checkbox no-drag ${checked ? 'checkbox--checked' : ''} checkbox--${variant}`}
      onClick={onChange}
      aria-checked={checked}
      role="checkbox"
    >
      <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden>
        <path
          d="M3.5 8.5l3 3 6-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
