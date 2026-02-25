import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export default function Input({
  className = '',
  error,
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      <input
        {...props}
        className={`
          w-full px-4 py-3
          text-sm font-mono text-primary
          bg-surface border rounded-sm
          placeholder:text-muted/50
          transition-colors duration-150
          focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent
          disabled:opacity-40 disabled:cursor-not-allowed
          ${error ? 'border-friction-high' : 'border-border hover:border-accent-dim'}
          ${className}
        `}
        aria-invalid={!!error}
      />
      {error && (
        <p className="mt-1.5 text-2xs text-friction-high" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
