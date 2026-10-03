'use client'

import { cx } from '@/lib/cx'

export interface FieldProps {
  id: string
  label: string
  type?: 'text' | 'email' | 'password'
  value: string
  onChange: (value: string) => void
  /** Validation message; renders as role="alert" and marks the input invalid. */
  error?: string | null
  autoComplete?: string
  placeholder?: string
  required?: boolean
}

/**
 * Labeled text field shared by the auth forms: visible label, inline error
 * wired via aria-describedby/aria-invalid, and the app-wide focus treatment.
 */
export function Field({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
  required,
}: FieldProps) {
  const errorId = `${id}-error`
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && (
          <span aria-hidden="true" className="text-danger">
            {' '}
            *
          </span>
        )}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cx(
          'w-full rounded-control border bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft',
          error ? 'border-danger' : 'border-line',
        )}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
