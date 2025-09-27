'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import DownloadProgressPopup from '@/components/ui/download-progress-popup'
import { 
  Search, 
  Settings, 
  LogOut, 
  User, 
  FileText,
  Download
} from 'lucide-react'
import Link from 'next/link'
import { type DownloadProgress } from '@/lib/offline/manager'


export function Header() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [downloadPopup, setDownloadPopup] = useState({
    isOpen: false,
    progress: null as DownloadProgress | null,
    fileName: '',
    fileSize: '',
    error: null as string | null
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  // Global download popup functions
  const showDownloadPopup = (fileName: string, fileSize?: string) => {
    setDownloadPopup({
      isOpen: true,
      progress: null,
      fileName,
      fileSize: fileSize || '',
      error: null
    })
  }

  const updateDownloadProgress = (progress: DownloadProgress) => {
    setDownloadPopup(prev => ({
      ...prev,
      progress,
      error: null
    }))
  }

  const setDownloadError = (error: string) => {
    setDownloadPopup(prev => ({
      ...prev,
      error
    }))
  }

  const closeDownloadPopup = () => {
    setDownloadPopup({
      isOpen: false,
      progress: null,
      fileName: '',
      fileSize: '',
      error: null
    })
  }

  // Expose functions globally for download buttons to use
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).showDownloadPopup = showDownloadPopup
      ;(window as any).updateDownloadProgress = updateDownloadProgress
      ;(window as any).setDownloadError = setDownloadError
    }
  }, [])

  if (status === 'loading') {
    return (
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-80 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </header>
    )
  }

  if (!session) {
    return (
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="">
                <img src="/logo.svg" alt="LeexDoc" className="w-6 h-6" />
              </div>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="btn-primary">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/documents" className="flex items-center space-x-3">
            <div className="w-32 h-full">
              <img src="/logo.svg" alt="LeexDoc" className="w-full h-full object-contain" />
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search documents, files, and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-200 h-12 text-lg rounded-lg shadow-sm focus:shadow-md transition-all duration-200"
              />
            </div>
          </form>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">


            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-gray-700 hover:bg-gray-100 p-2 rounded-lg">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white border border-gray-200 shadow-xl rounded-lg p-2">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">{session.user?.name}</p>
                  <p className="text-xs text-gray-500">{session.user?.email}</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700">
                    <Settings className="w-4 h-4 mr-3 text-gray-500" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/documents" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700">
                    <FileText className="w-4 h-4 mr-3 text-gray-500" />
                    My Documents
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/offline" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700">
                    <Download className="w-4 h-4 mr-3 text-gray-500" />
                    Offline Library
                  </Link>
                </DropdownMenuItem>
                <div className="border-t border-gray-200 my-2"></div>
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Download Progress Popup */}
      <DownloadProgressPopup
        isOpen={downloadPopup.isOpen}
        onClose={closeDownloadPopup}
        progress={downloadPopup.progress}
        fileName={downloadPopup.fileName}
        fileSize={downloadPopup.fileSize}
        error={downloadPopup.error}
      />
    </header>
  )
}