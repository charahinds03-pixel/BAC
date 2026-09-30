import type { ReactNode } from 'react'

interface BottomBarProps {
  children: ReactNode
  /** Sits in the page flow instead of sticking to the bottom (the style guide uses this). */
  inline?: boolean
}

/** The action area in the thumb zone, clear of the phone's home indicator. */
export function BottomBar({ children, inline = false }: BottomBarProps) {
  return <div className={inline ? 'bottom-bar bottom-bar--inline' : 'bottom-bar'}>{children}</div>
}
