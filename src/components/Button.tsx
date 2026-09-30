import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'quiet'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary: ink fill, one per screen. secondary: outline. quiet: text only. */
  variant?: Variant
  /** Full width, for the bottom bar on a phone. */
  block?: boolean
}

export function Button({ variant = 'primary', block = false, className, type = 'button', ...rest }: ButtonProps) {
  const classes = ['btn', `btn--${variant}`, block ? 'btn--block' : '', className ?? ''].filter(Boolean).join(' ')
  return <button type={type} className={classes} {...rest} />
}
