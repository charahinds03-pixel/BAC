import type { ReactNode } from 'react'

export type NoticeKind = 'loading' | 'empty' | 'error' | 'offline'

interface NoticeProps {
  kind: NoticeKind
  /** What happened, in a few words. */
  title: string
  /** What it means and what to do next, in one or two sentences. */
  children?: ReactNode
  action?: ReactNode
}

/** The four states every screen defines: loading, empty, error and offline. */
export function Notice({ kind, title, children, action }: NoticeProps) {
  return (
    <div className={`notice notice--${kind}`} role={kind === 'error' ? 'alert' : 'status'} aria-busy={kind === 'loading' || undefined}>
      <p className="notice__title">{title}</p>
      {children && <div className="notice__body">{children}</div>}
      {kind === 'loading' && <div className="notice__pen" aria-hidden="true" />}
      {action && <div className="notice__action">{action}</div>}
    </div>
  )
}
