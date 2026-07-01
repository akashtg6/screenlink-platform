import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  href?: string
  className?: string
  variant?: 'default' | 'light' | 'mono'
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Temporary typographic wordmark for ScreenLink.ai
 * Structured so an SVG mark can be dropped in without touching consumers.
 */
export function Logo({ href = '/', className, variant = 'default', size = 'md' }: LogoProps) {
  const sizeCls = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg'
  const dotColor =
    variant === 'light'
      ? 'text-accent'
      : variant === 'mono'
      ? 'text-current'
      : 'text-accent'
  const textColor =
    variant === 'light' ? 'text-white' : variant === 'mono' ? 'text-current' : 'text-foreground'

  const Wordmark = (
    <span className={cn('inline-flex items-baseline font-semibold tracking-tight', sizeCls, textColor, className)}>
      <span className="font-bold">Screen</span>
      <span className="font-light">Link</span>
      <span className={cn('ml-0.5 font-bold', dotColor)}>.ai</span>
    </span>
  )

  if (!href) return Wordmark
  return (
    <Link href={href} aria-label="ScreenLink.ai — Home" className="inline-flex">
      {Wordmark}
    </Link>
  )
}
