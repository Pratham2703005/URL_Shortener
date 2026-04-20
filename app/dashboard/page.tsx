'use client'

import { useState, useEffect } from 'react'
import { useSSO } from 'pratham-sso'
import { useRouter } from 'next/navigation'
import { toast } from 'robot-toast';
import { Copy, RefreshCw } from 'lucide-react';
import { useSyncStatus } from '@/app/providers';


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
  const { session, loading } = useSSO()
  const { isSynced, isSyncing, error: syncError, retry: retrySync } = useSyncStatus()
  const router = useRouter()
  const [urls, setUrls] = useState<Url[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form state
  const [originalUrl, setOriginalUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!session?.user?.email && !loading) {
      router.push('/')
    }
  }, [session?.user?.email, loading, router])
  
  // Fetch URLs
  const fetchUrls = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setPageLoading(true)
      }
      const res = await fetch('/api/urls')
      if (!res.ok) throw new Error('Failed to fetch URLs')
      const data = await res.json()
      setUrls(data.urls)
      setError('')
    } catch (err) {
      console.error(err)
      setError('Failed to load URLs')
    } finally {
      if (showLoadingState) {
        setPageLoading(false)
      }
    }
  }
  
  useEffect(() => {
    // Only fetch URLs after session is synced
    // Use optional chaining to avoid dependency on entire session object
    if (session?.user?.email && isSynced) {
      fetchUrls()
    }
  }, [session?.user?.email, isSynced])
  
  // Create URL
  const handleCreateUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // Check if user has reached the limit of 5 active URLs
    const activeUrlsCount = urls.filter(url => url.isActive).length
    if (activeUrlsCount >= 5) {
      toast.error({
        message: 'You can only have 5 active URLs at a time. Please deactivate some URLs first.',
        robotVariant: 'think',
        theme: 'dark',
        autoClose: 5000,
        hideProgressBar: true
      })
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
      toast.success({
        message: 'Short URL created successfully! 🎉',
        robotVariant: 'success',
        theme: 'dark',
        autoClose: 3000,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create URL'
      toast.error({
        message: errorMessage,
        robotVariant: 'error',
        theme: 'dark',
        autoClose: 5000,
        hideProgressBar: true
      })
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
        toast.error({
          message: 'Failed to delete URL',
          robotVariant: 'error',
          theme: 'dark',
          autoClose: 3000,
          hideProgressBar: true
        })
        throw new Error('Failed to delete URL')
      }
      toast.success({
        message: 'URL deleted successfully',
        robotVariant: 'wave',
        theme: 'dark',
        autoClose: 3000
      })
    } catch {
      // Error toast already shown above
      toast.error({
        message: 'Failed to delete URL',
        robotVariant: 'error',
        theme: 'dark',
        autoClose: 3000,
        hideProgressBar: true
      })
    }
  }
  
  // Toggle active status
  const handleToggle = async (id: string, isActive: boolean) => {
    if(!isActive && urls.filter(url => url.isActive).length >= 5) {
      toast.error({
        message: 'You can only have 5 active URLs at a time. Please deactivate some URLs first.',
        robotVariant: 'error',
        theme: 'dark',
        autoClose: 3000,
        hideProgressBar: true
      })
      return
    }

    // Optimistic update - update UI immediately
    setUrls(prevUrls =>
      prevUrls.map(url =>
        url.id === id ? { ...url, isActive: !isActive } : url
      )
    )
    
    // Show immediate feedback
    toast.success({
      message: isActive ? 'URL deactivated' : 'URL activated',
      robotVariant: 'wave',
      theme: 'dark',
      hideProgressBar: true,
      autoClose: 3000
    })
    
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
        toast.error({
          message: 'Failed to update URL',
          robotVariant: 'error',
          theme: 'dark',
          autoClose: 3000,
          hideProgressBar: true
        })
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
    toast.success({
      message: 'Copied to clipboard! 📋',
      robotVariant: 'wave',
      hideProgressBar: true,
      autoClose: 3000,
      theme: 'dark'
    })
  }
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg font-semibold">Logging you in...</div>
          <div className="text-sm text-gray-500">Initializing your session</div>
        </div>
      </div>
    )
  }

  if (!isSynced && session?.user?.email) {
    if (syncError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-black px-4">
          <div className="text-center max-w-md">
            <div className="mb-2 text-lg font-semibold text-red-500">Sync failed</div>
            <div className="mb-4 text-sm text-zinc-400">{syncError}</div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={retrySync}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => router.push('/')}
                className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-600 transition-colors"
              >
                Sign in again
              </button>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg font-semibold">{isSyncing ? 'Syncing your data...' : 'Preparing your session...'}</div>
          <div className="text-sm text-gray-500">Retrieving your URLs</div>
        </div>
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
          <div className="flex items-center gap-2 sm:gap-4"></div>
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Your URLs</h2>
            <button
              onClick={() => fetchUrls(true)}
              disabled={pageLoading}
              className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Refresh URLs"
            >
              <RefreshCw 
                size={18} 
                className={`text-gray-600 ${pageLoading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
          
          {pageLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading your URLs...</p>
            </div>
          ) : urls.length === 0 ? (
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
