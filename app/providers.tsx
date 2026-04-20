'use client'

import { SSOProvider, useSSO } from 'pratham-sso'
import { useEffect, useState, createContext, useContext, useRef, useCallback } from 'react'

type SyncState = {
  isSynced: boolean
  isSyncing: boolean
  error: string | null
  retry: () => void
}

const SyncContext = createContext<SyncState>({
  isSynced: false,
  isSyncing: false,
  error: null,
  retry: () => {},
})

export function useSyncStatus() {
  return useContext(SyncContext)
}

const SYNC_TIMEOUT_MS = 8000

function SyncUserOnAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSSO()
  const [isSynced, setIsSynced] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const syncAttemptedRef = useRef<string | null>(null)
  const [retryNonce, setRetryNonce] = useState(0)

  const retry = useCallback(() => {
    syncAttemptedRef.current = null
    setRetryNonce((n) => n + 1)
  }, [])

  useEffect(() => {
    if (loading) return
    if (!session?.user?.email) {
      syncAttemptedRef.current = null
      setIsSynced(false)
      setIsSyncing(false)
      setError(null)
      return
    }

    const currentEmail = session.user.email
    if (syncAttemptedRef.current === currentEmail) return
    syncAttemptedRef.current = currentEmail

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS)

    setIsSynced(false)
    setIsSyncing(true)
    setError(null)

    fetch('/api/auth/sync-user', { method: 'POST', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || `Sync failed (${response.status})`)
        }
        setIsSynced(true)
        setError(null)
      })
      .catch((err) => {
        setIsSynced(false)
        setError(err.name === 'AbortError' ? 'Sync timed out. Please retry.' : err.message || 'Sync failed')
      })
      .finally(() => {
        clearTimeout(timeoutId)
        setIsSyncing(false)
      })

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [session?.user?.email, loading, retryNonce])

  return (
    <SyncContext.Provider value={{ isSynced, isSyncing, error, retry }}>
      {children}
    </SyncContext.Provider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SSOProvider
      idpServer={process.env.NEXT_PUBLIC_IDP_SERVER!}
      clientId={process.env.NEXT_PUBLIC_CLIENT_ID!}
      redirectUri={process.env.NEXT_PUBLIC_REDIRECT_URI!}
    >
      <SyncUserOnAuth>{children}</SyncUserOnAuth>
    </SSOProvider>
  )
}