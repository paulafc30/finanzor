/**
 * Botón con variantes. Las clases vienen de Tailwind y de los tokens
 * definidos en tailwind.config.js (accent, bg-card, etc.)
 */
const variants = {
  primary:
    'bg-accent text-white hover:bg-accent-muted disabled:opacity-50',
  secondary:
    'bg-bg-card text-white hover:bg-bg-card/80 disabled:opacity-50',
  ghost:
    'bg-transparent text-white/80 hover:bg-white/5',
  danger:
    'bg-danger text-white hover:bg-danger/90 disabled:opacity-50',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
      {...rest}
    />
  )
}
