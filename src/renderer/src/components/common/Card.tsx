import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  accent?: boolean
}

export function Card({ children, className = '', accent = false }: CardProps): JSX.Element {
  return (
    <div className={`card ${accent ? 'card--accent' : ''} ${className}`}>
      {accent && <span className="card__accent-bar" aria-hidden />}
      {children}
    </div>
  )
}
