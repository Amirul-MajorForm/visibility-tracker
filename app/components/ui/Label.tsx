import { ReactNode, CSSProperties } from 'react'

export default function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div className="section-label" style={style}>{children}</div>
}
