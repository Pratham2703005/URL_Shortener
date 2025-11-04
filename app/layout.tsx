import { Providers } from './providers'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata = {
  title: 'URL Shortener - Shorten Links & Track Analytics',
  description: 'Free URL shortener with analytics tracking. Create short links, track clicks, and manage your URLs with ease.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  )
}