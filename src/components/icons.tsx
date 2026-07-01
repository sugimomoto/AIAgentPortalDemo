import type { ParticipantIcon } from '@/lib/types'
import { MS_LOGO } from '@/lib/tokens'

type IconProps = {
  size?: number
  className?: string
  color?: string
}

const base = (size: number, color?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color ?? 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export function ShieldCheckIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...base(size, color)} className={className} aria-hidden>
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

export function PersonIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...base(size, color)} className={className} aria-hidden>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </svg>
  )
}

export function LockIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...base(size, color)} className={className} aria-hidden>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  )
}

export function BrowserIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...base(size, color)} className={className} aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2.2" />
      <path d="M4 9h16" />
      <circle cx="6.7" cy="7" r="0.4" fill="currentColor" />
    </svg>
  )
}

export function SparkleIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...base(size, color)} className={className} aria-hidden>
      <path d="M12 3c.7 4.4 1.6 5.3 6 6-4.4.7-5.3 1.6-6 6-.7-4.4-1.6-5.3-6-6 4.4-.7 5.3-1.6 6-6z" />
    </svg>
  )
}

export function LinkIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...base(size, color)} className={className} aria-hidden>
      <path d="M9.5 14.5l5-5" />
      <path d="M8 11l-1.8 1.8a3.2 3.2 0 0 0 4.5 4.5L12.5 15.5" />
      <path d="M16 13l1.8-1.8a3.2 3.2 0 0 0-4.5-4.5L11.5 8.5" />
    </svg>
  )
}

export function CloudIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...base(size, color)} className={className} aria-hidden>
      <path d="M7.5 18a3.5 3.5 0 0 1-.3-7A5 5 0 0 1 17 10.2 3.4 3.4 0 0 1 16.5 18h-9z" />
    </svg>
  )
}

export function SearchIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...base(size, color)} className={className} aria-hidden>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.2-4.2" />
    </svg>
  )
}

export function SendIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...base(size, color)} className={className} aria-hidden>
      <path d="M4 12l16-7-7 16-2.5-6.5L4 12z" />
    </svg>
  )
}

export function ChevronDownIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...base(size, color)} className={className} aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function LogoutIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...base(size, color)} className={className} aria-hidden>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 12H3" />
      <path d="M7 8l-4 4 4 4" />
    </svg>
  )
}

/** 参加者アイコンの種別マッピング */
export function ParticipantGlyph({
  icon,
  size = 24,
  color,
  className,
}: IconProps & { icon: ParticipantIcon }) {
  switch (icon) {
    case 'user':
      return <PersonIcon size={size} color={color} className={className} />
    case 'lock':
      return <LockIcon size={size} color={color} className={className} />
    case 'browser':
      return <BrowserIcon size={size} color={color} className={className} />
    case 'sparkle':
      return <SparkleIcon size={size} color={color} className={className} />
    case 'link':
      return <LinkIcon size={size} color={color} className={className} />
    case 'cloud':
      return <CloudIcon size={size} color={color} className={className} />
  }
}

/** Microsoft 4色ロゴ（CSS グリッド） */
export function MicrosoftLogo({ size = 18 }: { size?: number }) {
  const cell = (size - 2) / 2
  return (
    <span
      style={{
        display: 'grid',
        gridTemplateColumns: `${cell}px ${cell}px`,
        gridTemplateRows: `${cell}px ${cell}px`,
        gap: 2,
      }}
      aria-hidden
    >
      <span style={{ background: MS_LOGO.topLeft }} />
      <span style={{ background: MS_LOGO.topRight }} />
      <span style={{ background: MS_LOGO.bottomLeft }} />
      <span style={{ background: MS_LOGO.bottomRight }} />
    </span>
  )
}

/** アプリ／ヘッダーのロゴ（グラデ角丸＋白シールド） */
export function BrandLogo({ size = 42, radius = 11 }: { size?: number; radius?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: 'linear-gradient(135deg,#2563EB,#152C55)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-hidden
    >
      <ShieldCheckIcon size={size * 0.55} color="#fff" />
    </span>
  )
}
