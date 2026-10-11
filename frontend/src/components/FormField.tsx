import type { ReactNode } from 'react'
import './FormField.css'

interface FormFieldProps {
  id: string // must match the id of the input inside
  label: string
  required?: boolean
  optional?: boolean
  hint?: string
  error?: string
  children: ReactNode
}

// Adds the accessibility attributes that connect an input to its hint and error.
export function fieldAria(id: string, hint?: string, error?: string) {
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
    .filter(Boolean)
    .join(' ')

  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
  }
}

export default function FormField({
  id,
  label,
  required,
  optional,
  hint,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && (
          <span className="req" aria-hidden="true">
            {' '}
            *
          </span>
        )}
        {optional && <span className="opt"> (optional)</span>}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}