'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner';
import { Copy , LogOut } from 'lucide-react';


type Url = {
  id: string
  originalUrl: string
  shortCode: string
  customAlias: string | null
  createdAt: string
  clickCount: number
  isActive: boolean
  expiresAt: string | null
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [urls, setUrls] = useState<Url[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form state
  const [originalUrl, setOriginalUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])
  
  // Fetch URLs
  const fetchUrls = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true)
      }
      const res = await fetch('/api/urls')
      if (!res.ok) throw new Error('Failed to fetch URLs')
      const data = await res.json()
      setUrls(data.urls)
    } catch (err) {
      console.error(err)
      setError('Failed to load URLs')
    } finally {
      if (showLoadingState) {
        setLoading(false)
      }
    }
  }
  
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUrls()
    }
  }, [status])
  
  // Create URL
  const handleCreateUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // Check if user has reached the limit of 5 active URLs
    const activeUrlsCount = urls.filter(url => url.isActive).length
    if (activeUrlsCount >= 5) {
      toast.error('You can only have 5 active URLs at a time. Please deactivate some URLs first.')
      setError('You can only have 5 active URLs at a time. Please deactivate some URLs first.')
      return
    }
    
    // Create optimistic URL with temporary ID
    const tempId = `temp-${Date.now()}`
    const optimisticUrl: Url = {
      id: tempId,
      originalUrl,
      shortCode: 'generating...',
      customAlias: customAlias || null,
      createdAt: new Date().toISOString(),
      clickCount: 0,
      isActive: true,
      expiresAt: null,
    }
    
    // Add to UI immediately
    setUrls(prevUrls => [optimisticUrl, ...prevUrls])
    

    
    // Clear form
    const savedOriginalUrl = originalUrl
    const savedCustomAlias = customAlias
    setOriginalUrl('')
    setCustomAlias('')
    
    try {
      const res = await fetch('/api/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: savedOriginalUrl,
          customAlias: savedCustomAlias || undefined,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        // Remove optimistic URL and restore form
        setUrls(prevUrls => prevUrls.filter(url => url.id !== tempId))
        setOriginalUrl(savedOriginalUrl)
        setCustomAlias(savedCustomAlias)
        throw new Error(data.error || 'Failed to create URL')
      }
      
      // Replace optimistic URL with real data
      setUrls(prevUrls => 
        prevUrls.map(url => url.id === tempId ? data.url : url)
      )
      setSuccess('Short URL created successfully! 🎉')
      toast.success('Short URL created successfully! 🎉')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create URL'
      toast.error(errorMessage)
      setError(errorMessage)
    }
  }
  
  // Delete URL
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this URL?')) return
    
    // Optimistic update - remove from UI immediately
    const deletedUrl = urls.find(url => url.id === id)
    setUrls(prevUrls => prevUrls.filter(url => url.id !== id))
    
    try {
      const res = await fetch(`/api/urls/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        // Revert on error
        if (deletedUrl) {
          setUrls(prevUrls => [...prevUrls, deletedUrl].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ))
        }
        toast.error('Failed to delete URL')
        throw new Error('Failed to delete URL')
      }
      toast.success('URL deleted successfully')
    } catch {
      // Error toast already shown above
    }
  }
  
  // Toggle active status
  const handleToggle = async (id: string, isActive: boolean) => {
    if(!isActive && urls.filter(url => url.isActive).length >= 5) {
      toast.error('You can only have 5 active URLs at a time. Please deactivate some URLs first.')
      return
    }

    // Optimistic update - update UI immediately
    setUrls(prevUrls =>
      prevUrls.map(url =>
        url.id === id ? { ...url, isActive: !isActive } : url
      )
    )
    
    // Show immediate feedback
    toast.success(isActive ? 'URL deactivated' : 'URL activated')
    
    try {
      const res = await fetch(`/api/urls/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (!res.ok) {
        // Revert on error
        setUrls(prevUrls =>
          prevUrls.map(url =>
            url.id === id ? { ...url, isActive } : url
          )
        )
        toast.error('Failed to update URL')
        throw new Error('Failed to update URL')
      }
    } catch {
      // Error toast already shown above
    }
  }
  
  // Copy to clipboard
  const copyToClipboard = (shortCode: string, customAlias: string | null) => {
    const shortUrl = `${window.location.origin}/s/${customAlias || shortCode}`
    navigator.clipboard.writeText(shortUrl)
    toast.success('Copied to clipboard! 📋')
  }
  
  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }
  
  if (!session) {
    return null
  }
  
  return (
    <div className="min-h-screen bg-black py-4 sm:py-8">
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">Dashboard</h1>
            <p className="text-sm sm:text-base text-zinc-400 truncate max-w-[200px] sm:max-w-none">Welcome back, {session.user?.name}!</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {session.user?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt="Profile"
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full"
              />
            )}
            <button
              onClick={() => signOut()}
              className="rounded-full hover:bg-[rgba(255,0,0,0.1)] hover:outline-1 hover:outline-red-900 p-3 sm:p-4"
            >
              <LogOut className='text-red-600' size={16} />
            </button>
          </div>
        </div>
        
        {/* Alerts */}
        {error && (
          <div className="mb-4 rounded-lg bg-[rgba(255,0,0,0.1)] p-4 outline-1 ring-red-600 text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-[rgba(0,255,0,0.1)] p-4 outline-1 ring-green-600 text-green-600">
            {success}
          </div>
        )}
        
        {/* Create URL Form */}
        <div className="mb-6 sm:mb-8 rounded-lg bg-white p-4 sm:p-6 shadow-md invert">
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Create Short URL</h2>
            <div className="text-xs sm:text-sm">
              <span className={`font-semibold ${urls.filter(u => u.isActive).length >= 5 ? 'text-red-600' : 'text-gray-600'}`}>
                {urls.filter(u => u.isActive).length}/5
              </span>
              <span className="text-gray-500"> active URLs</span>
            </div>
          </div>
          <form onSubmit={handleCreateUrl} className="space-y-4">
            <div>
              <label htmlFor="originalUrl" className="mb-1 block text-sm font-medium text-gray-800">
                Original URL *
              </label>
              <input
                type="url"
                id="originalUrl"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                placeholder="https://example.com/very/long/url"
                required
                className="text-gray-900 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="customAlias" className="mb-1 block text-sm font-medium text-gray-800">
                Custom Alias (optional)
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="text-gray-700 text-xs sm:text-sm whitespace-nowrap">{window.location.origin}/s/</span>
                <input
                  type="text"
                  id="customAlias"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  placeholder="my-link"
                  pattern="[a-zA-Z0-9_-]{3,20}"
                  className="text-gray-900 w-full sm:flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                3-20 characters: letters, numbers, hyphens, underscores
              </p>
            </div>
            
            <button
              type="submit"
              className="w-full sm:w-auto rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Create Short URL
            </button>
          </form>
        </div>
        
        {/* URLs List */}
        <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md invert">
          <h2 className="mb-4 text-lg sm:text-xl font-bold text-gray-900">Your URLs</h2>
          
          {urls.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No URLs yet. Create your first one above!
            </p>
          ) : (
            <div className="space-y-4">
              {urls.map((url) => {
                const shortUrl = `${window.location.origin}/s/${url.customAlias || url.shortCode}`
                const isGenerating = url.shortCode === 'generating...'
                
                return (
                  <div
                    key={url.id}
                    className={`rounded-lg border p-3 sm:p-4 transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
                      url.isActive ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50 opacity-75'
                    } ${isGenerating ? 'animate-pulse' : ''}`}
                  >
                    <div className="mb-2 flex flex-col sm:flex-row items-start justify-between gap-2">
                      <div className="flex-1 w-full">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <a
                            href={shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm sm:text-lg font-semibold text-blue-600 hover:underline break-all"
                          >
                            {shortUrl}
                          </a>
                          <button
                            onClick={() => copyToClipboard(url.shortCode, url.customAlias)}
                            disabled={isGenerating}
                            className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Copy size={12} className="sm:w-3.5 sm:h-3.5" />
                          </button>
                          {!url.isActive && (
                            <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800 animate-in fade-in duration-200">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 break-all">
                          → {url.originalUrl}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-gray-500">
                      <div className="flex flex-wrap gap-2 sm:gap-4">
                        <span>👆 {url.clickCount} clicks</span>
                        <span>📅 {new Date(url.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleToggle(url.id, url.isActive)}
                          disabled={isGenerating}
                          className="flex-1 sm:flex-none rounded bg-blue-100 px-2 sm:px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {url.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(url.id)}
                          disabled={isGenerating}
                          className="flex-1 sm:flex-none rounded bg-red-100 px-2 sm:px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
