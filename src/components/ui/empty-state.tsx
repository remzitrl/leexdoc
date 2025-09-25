import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Music, Upload, Search, Plus } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  secondaryAction 
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
          {icon || <Music className="w-16 h-16" />}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{description}</p>
        
        <div className="flex gap-4 justify-center">
          {action && (
            <Button asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function EmptyLibrary() {
  return (
    <EmptyState
      icon={<Music className="w-16 h-16" />}
      title="No tracks found"
      description="Upload some music to get started with your library"
      action={{
        label: "Upload Music",
        href: "/upload"
      }}
    />
  )
}

export function EmptyPlaylists() {
  return (
    <EmptyState
      icon={<Music className="w-16 h-16" />}
      title="No playlists yet"
      description="Create your first playlist to organize your music"
      action={{
        label: "Create Playlist",
        href: "/playlists"
      }}
    />
  )
}

export function EmptySearch() {
  return (
    <EmptyState
      icon={<Search className="w-16 h-16" />}
      title="No results found"
      description="Try adjusting your search or filters"
      secondaryAction={{
        label: "Clear Search",
        onClick: () => window.location.reload()
      }}
    />
  )
}
