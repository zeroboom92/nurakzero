import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'soft'
  children: ReactNode
}

export function Button({
  variant = 'primary',
  children,
  className = '',
  ...rest
}: ButtonProps): JSX.Element {
  return (
    <button type="button" className={`btn btn--${variant} no-drag ${className}`} {...rest}>
      {children}
    </button>
  )
}
