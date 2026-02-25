interface CardProps {
  children: React.ReactNode
  className?: string
  as?: React.ElementType
}

/**
 * Base surface card. Wraps the repeated pattern:
 * bg-surface border border-border rounded-sm p-inner shadow-card
 *
 * Use `as` to render as <article>, <li>, <div>, etc.
 * Add className to extend or override.
 */
export default function Card({
  children,
  className = '',
  as: Tag = 'div',
}: CardProps) {
  return (
    <Tag
      className={`bg-surface border border-border rounded-sm p-inner shadow-card ${className}`}
    >
      {children}
    </Tag>
  )
}
