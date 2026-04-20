'use client'

import { useSSO } from 'pratham-sso'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import LoginButton from '@/components/LoginButton'

export default function Home() {
  const { session } = useSSO()
  const router = useRouter()

  useEffect(() => {
    if (session?.user?.email) {
      router.push('/dashboard')
    }
  }, [session?.user?.email, router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-24 bg-black">
      <div className="text-center max-w-2xl w-full px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-zinc-100">🔗 URL Shortener</h1>
        <p className="text-base sm:text-lg text-gray-300 mb-6 sm:mb-8 w-full">
          Shorten your links, track analytics, and share with ease.
        </p>
        <LoginButton />
      </div>
    </main>
  )
}