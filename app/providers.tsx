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
    if (!loading && session?.user?.email) {
      const currentEmail = session.user.email
      
      // Account changed - need to reset sync status before fetching new user's data
      if (syncAttemptedRef.current !== currentEmail) {
        syncAttemptedRef.current = currentEmail
        
        // Mark as not synced until sync completes  
        // Defer to avoid lint warning about synchronous setState
        Promise.resolve().then(() => setIsSynced(false))

        // Perform sync
        fetch('/api/auth/sync-user', {
          method: 'POST',
        })
          .then(response => {
            if (response.ok) {
              setIsSynced(true)
            } else {
              setIsSynced(false)
            }
          })
          .catch(() => setIsSynced(false))
      }
    } else if (!session && !loading) {
      // User logged out
      syncAttemptedRef.current = null
    }
  }, [session, loading])

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