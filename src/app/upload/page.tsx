'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import FileUpload from '@/components/upload/FileUpload'

export default function UploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])
  
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
          <p className="text-lg text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!session) {
    return null
  }
  
  return (
    <div className="container mx-auto px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text font-poppins mb-3">Upload Files</h1>
          <p className="text-slate-600 text-lg">
            Upload your documents and prepare them for offline access
          </p>
        </div>
        
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <FileUpload onClose={() => {}} />
        </div>
      </div>
    </div>
  )
}