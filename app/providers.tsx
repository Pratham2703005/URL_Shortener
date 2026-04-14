'use client'

import { SSOProvider } from 'pratham-sso'
import { useEffect, useState, createContext, useContext, useRef } from 'react'
import { useSSO } from 'pratham-sso'

// Context to track sync status
const SyncContext = createContext<{ isSynced: boolean }>({ isSynced: false })

export function useSyncStatus() {
  return useContext(SyncContext)
}

function SyncUserOnAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSSO()
  const [isSynced, setIsSynced] = useState(false)
  const syncAttemptedRef = useRef<string | null>(null)

  useEffect(() => {
    // Only sync if we have a session and haven't already synced this email
    if (session?.user?.email && !loading && syncAttemptedRef.current !== session.user.email) {
      syncAttemptedRef.current = session.user.email

      // Immediately start sync - no debounce on account switch
      fetch('/api/auth/sync-user', {
        method: 'POST',
      })
        .then(response => {
          if (response.ok) {
            setIsSynced(true)
          } else {
            console.error('Failed to sync user:', response.statusText)
            setIsSynced(false)
          }
        })
        .catch(error => {
          console.error('Failed to sync user:', error)
          setIsSynced(false)
        })
    } else if (!session && !loading) {
      // User logged out
      syncAttemptedRef.current = null
    }
  }, [session?.user?.email, loading, session])

  return (
    <SyncContext.Provider value={{ isSynced }}>
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