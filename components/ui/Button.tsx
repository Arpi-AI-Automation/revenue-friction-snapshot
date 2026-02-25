import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'ghost'
}

export default function Button({
  children,
  loading = false,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  const base = `
    inline-flex items-center justify-center gap-2
    px-5 py-3 text-xs font-medium
    rounded-sm transition-all duration-150
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent
    disabled:opacity-40 disabled:cursor-not-allowed
  `

  const variants = {
    primary: `
      bg-primary text-background
      hover:bg-primary/90 active:bg-primary/80
    `,
    ghost: `
      bg-transparent text-muted border border-border
      hover:text-primary hover:border-accent-dim
    `,
  }

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading && (
        <svg
          className="animate-spin w-3.5 h-3.5"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="7" cy="7" r="5.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="22"
            strokeDashoffset="8"
            opacity="0.4"
          />
          <path
            d="M7 1.5a5.5 5.5 0 0 1 5.5 5.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
