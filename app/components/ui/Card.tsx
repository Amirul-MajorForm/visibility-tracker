import { ReactNode, CSSProperties } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  accentLeft?: boolean
  style?: CSSProperties
}

export default function Card({ children, className = '', accentLeft = false, style }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '20px 24px',
        borderLeft: accentLeft ? '3px solid var(--accent)' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
