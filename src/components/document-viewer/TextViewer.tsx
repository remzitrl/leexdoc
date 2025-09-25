'use client'

import { useState, useEffect } from 'react'
import { Document } from '@/lib/document-store'
import { Button } from '@/components/ui/button'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download,
  Search,
  Type
} from 'lucide-react'

interface TextViewerProps {
  document: Document
}

export default function TextViewer({ document }: TextViewerProps) {
  const [content, setContent] = useState<string>('')
  const [fontSize, setFontSize] = useState(16)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadText = async () => {
      try {
        const response = await fetch(`/api/documents/${document.id}/download`)
        if (!response.ok) throw new Error('Failed to load text')
        
        const blob = await response.blob()
        const text = await blob.text()
        setContent(text)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading text:', error)
        setError('Failed to load text content')
        setIsLoading(false)
      }
    }

    loadText()
  }, [document.id])

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 32))
  }

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 10))
  }

  const resetFontSize = () => {
    setFontSize(16)
  }

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term) return text
    
    const regex = new RegExp(`(${term})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-300 text-black">$1</mark>')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading text...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="text-gray-400 hover:text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={decreaseFontSize}
            className="text-gray-400 hover:text-white"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-300 min-w-[60px] text-center">
            {fontSize}px
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={increaseFontSize}
            className="text-gray-400 hover:text-white"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFontSize}
            className="text-gray-400 hover:text-white"
          >
            Reset
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search in text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-700 text-white px-2 py-1 rounded text-sm w-48"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`/api/documents/${document.id}/download`, '_blank')}
            className="text-gray-400 hover:text-white"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Text Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center mb-4 pb-2 border-b">
              <Type className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">{document.title}</h3>
            </div>
            
            <div 
              className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{
                __html: highlightSearchTerm(content, searchTerm)
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Characters: {content.length.toLocaleString()}</span>
          <span>Words: {content.split(/\s+/).filter(word => word.length > 0).length.toLocaleString()}</span>
          <span>Lines: {content.split('\n').length.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
