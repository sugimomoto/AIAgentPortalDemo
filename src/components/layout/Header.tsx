'use client'

import { useState } from 'react'
import type { User, UserKey } from '@/lib/types'
import { USER_LIST } from '@/lib/mockData'
import { BrandLogo, ChevronDownIcon, LogoutIcon } from '@/components/icons'

type Props = {
  user: User
  onSelectUser: (key: UserKey) => void
  onLogout: () => void
}

function RoleBadge({ user, size = 13.5 }: { user: User; size?: number }) {
  return (
    <span
      style={{
        fontSize: size,
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: 7,
        color: user.roleColor,
        background: user.roleBg,
      }}
    >
      {user.jobTitle}
    </span>
  )
}

function Avatar({ user, size = 46 }: { user: User; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: user.avatarBg,
        color: '#fff',
        fontSize: size * 0.41,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-hidden
    >
      {user.initial}
    </span>
  )
}

export function Header({ user, onSelectUser, onLogout }: Props) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <header
      style={{
        height: 78,
        background: '#0F1E3D',
        color: '#fff',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      {/* 左：ロゴ＋アプリ名 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <BrandLogo size={42} radius={11} />
        <span style={{ fontSize: 24, fontWeight: 700 }}>AI Agent Portal</span>
      </div>

      {/* 右：ユーザー切替＋ログアウト */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
        <button
          type="button"
          aria-label="ユーザー切替"
          aria-expanded={showMenu}
          onClick={() => setShowMenu((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          <Avatar user={user} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>{user.name}</span>
          <RoleBadge user={user} />
          <ChevronDownIcon size={20} color="#94A3B8" />
        </button>

        <button
          type="button"
          aria-label="ログアウト"
          onClick={onLogout}
          style={{
            width: 46,
            height: 46,
            borderRadius: 11,
            background: 'rgba(255,255,255,.06)',
            border: 'none',
            color: '#94A3B8',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <LogoutIcon size={22} />
        </button>

        {showMenu && (
          <>
            {/* クリックで閉じる全画面オーバーレイ */}
            <div
              onClick={() => setShowMenu(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 40 }}
              aria-hidden
            />
            <div
              role="menu"
              style={{
                position: 'absolute',
                top: 60,
                right: 60,
                width: 344,
                background: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                boxShadow: '0 24px 54px -14px rgba(15,30,61,.4)',
                padding: 10,
                zIndex: 50,
              }}
            >
              <p style={{ fontSize: 13, color: '#94A3B8', padding: '6px 8px 8px' }}>ユーザー切替</p>
              {USER_LIST.map((u) => (
                <button
                  key={u.key}
                  type="button"
                  role="menuitemradio"
                  aria-checked={u.key === user.key}
                  onClick={() => {
                    onSelectUser(u.key)
                    setShowMenu(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    padding: '10px 8px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Avatar user={u} size={44} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                    <span style={{ fontSize: 17, fontWeight: 600, color: '#0F172A' }}>
                      {u.name}
                    </span>
                    <RoleBadge user={u} size={13} />
                  </span>
                  {u.key === user.key && (
                    <span style={{ color: '#2563EB', fontSize: 18 }} aria-hidden>
                      ●
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </header>
  )
}
