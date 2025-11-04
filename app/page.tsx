'use client'

import LoginButton from '@/components/LoginButton'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Toaster } from 'sonner';

export default function Home() {
  const { status } = useSession()
  const router = useRouter()
  
  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-24 bg-black">
      <Toaster />
      <div className="text-center max-w-2xl w-full px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-zinc-100">🔗 URL Shortener</h1>
        <p className="text-base sm:text-lg text-gray-300 mb-6 sm:mb-8 w-full">
          Shorten your links, track analytics, and share with ease. Sign in to get started!
        </p>
        <LoginButton />
      </div>
    </main>
  )
}