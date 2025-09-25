import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import OfflineLibrary from '@/components/offline/OfflineLibrary'

export default async function OfflinePage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }
  
  return <OfflineLibrary />
}