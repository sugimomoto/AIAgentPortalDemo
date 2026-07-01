import type { FlowStatus } from '@/lib/types'

/** 矢印/バッジの色をステップ状態から決める */
export function statusColor(status: FlowStatus, accent: string): string {
  switch (status) {
    case 'processing':
    case 'done':
      return accent
    case 'waiting':
      return '#FBBF24'
    case 'error':
      return '#EF4444'
    case 'idle':
    default:
      return 'rgba(148,163,184,.30)'
  }
}

/** 進行中（アニメーション対象）か */
export function isActive(status: FlowStatus): boolean {
  return status === 'processing' || status === 'waiting'
}
