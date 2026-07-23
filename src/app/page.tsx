'use client'

import { useAuth } from '@/hooks/useAuth'
import { useAgent } from '@/hooks/useAgent'
import { resolveStepDelay } from '@/lib/tokens'
import { LoginScreen } from '@/components/LoginScreen'
import { Header } from '@/components/layout/Header'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { InsideAgentPanel } from '@/components/agent/InsideAgentPanel'

export default function Page() {
  const auth = useAuth()
  const stepDelay = resolveStepDelay(process.env.NEXT_PUBLIC_STEP_DELAY_MS)
  // mock 時は getAccessToken 未使用。real 時のみ OBO→Foundry トークン取得に使う。
  const agent = useAgent(auth.user, {
    stepDelay,
    mockMode: auth.mockMode,
    getAccessToken: auth.mockMode ? undefined : auth.getAccessToken,
  })

  if (auth.screen === 'login') {
    return <LoginScreen onLogin={auth.login} error={auth.error} />
  }

  const handleLogout = () => {
    agent.reset()
    auth.logout()
  }

  const handleSelectUser = (key: Parameters<typeof auth.selectUser>[0]) => {
    agent.reset()
    auth.selectUser(key)
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header user={auth.user} onSelectUser={handleSelectUser} onLogout={handleLogout} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ChatPanel
          messages={agent.messages}
          thinking={agent.thinking}
          busy={agent.busy}
          onSend={agent.send}
        />
        <InsideAgentPanel
          userKey={auth.userKey}
          flow={agent.flow}
          awaitingConsent={agent.awaitingConsent}
          onApprove={agent.approveConsent}
        />
      </div>
    </div>
  )
}
