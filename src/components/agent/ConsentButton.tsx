'use client'

type Props = {
  visible: boolean
  onApprove: () => void
}

/** ④ のサインイン行に出るコンセント承認ボタン（awaitingConsent 時のみ表示） */
export function ConsentButton({ visible, onApprove }: Props) {
  if (!visible) return null
  return (
    <button
      type="button"
      onClick={onApprove}
      style={{
        marginTop: 8,
        background: '#38BDF8',
        color: '#04263B',
        fontSize: 13,
        fontWeight: 700,
        padding: '8px 16px',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        animation: 'consentGlow 1.6s ease-in-out infinite',
      }}
    >
      CData OAuth を承認してサインイン
    </button>
  )
}
