import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

// Use <Button> for actions (submit, click handlers).
export default function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`.trim()}
      {...rest}
    />
  )
}

interface ButtonLinkProps {
  to: string
  variant?: Variant
  className?: string
  onClick?: () => void
  children: ReactNode
}

// Use <ButtonLink> for navigation (looks like a button, works like a link).
export function ButtonLink({
  to,
  variant = 'primary',
  className = '',
  onClick,
  children,
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`btn btn-${variant} ${className}`.trim()}
    >
      {children}
    </Link>
  )
}
