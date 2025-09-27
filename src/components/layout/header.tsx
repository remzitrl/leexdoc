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
  Settings, 
  LogOut, 
  User
} from 'lucide-react'
import Link from 'next/link'
import { type DownloadProgress } from '@/lib/offline/manager'


export function Header() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [downloadPopup, setDownloadPopup] = useState({
    isOpen: false,
    progress: null as DownloadProgress | null,
    fileName: '',
    fileSize: '',
    error: null as string | null
  })

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

  // Hide header on login and register pages
  const hideHeaderPages = ['/login', '/register']
  if (hideHeaderPages.includes(pathname)) {
    return null
  }

  if (status === 'loading') {
    return (
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </header>
    )
  }

  if (!session) {
    return (
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-3">
                <div className="">
                  <span className="text-xl font-bold text-gray-900">LeexDoc</span>
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
        </div>
      </header>
    )
  }

  return (
    <header className="border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="">
                <span className="text-2xl font-bold text-gray-900">LeexDoc</span>
              </div>
            </Link>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-700 hover:bg-gray-100 focus:bg-gray-100 p-2 rounded-lg data-[state=open]:bg-gray-100">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center">
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