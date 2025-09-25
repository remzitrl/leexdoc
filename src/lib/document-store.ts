import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Document {
  id: string
  title: string
  originalName: string
  mimeType: string
  fileSize: number
  fileKey: string
  thumbnailKey?: string
  category: 'PDF' | 'Audio' | 'Video' | 'Image' | 'Document' | 'Archive' | 'Other'
  tags: string[]
  description?: string
  isPublic: boolean
  status: 'Processing' | 'Ready' | 'Failed'
  uploadedAt: string
  lastAccessedAt?: string
  accessCount: number
}

export interface DownloadItem {
  id: string
  document: Document
  state: 'Prefetching' | 'Available' | 'Error'
  bytesTotal?: number
  bytesStored?: number
  progress: number
}

export interface DocumentStore {
  // Documents
  documents: Document[]
  currentDocument: Document | null
  
  // Downloads
  downloads: DownloadItem[]
  isDownloading: boolean
  
  // UI State
  viewMode: 'grid' | 'list'
  sortBy: 'name' | 'date' | 'size' | 'type'
  sortOrder: 'asc' | 'desc'
  filterCategory: string | null
  searchQuery: string
  
  // Actions
  setDocuments: (documents: Document[]) => void
  addDocument: (document: Document) => void
  updateDocument: (id: string, updates: Partial<Document>) => void
  deleteDocument: (id: string) => void
  setCurrentDocument: (document: Document | null) => void
  
  // Downloads
  addDownload: (download: DownloadItem) => void
  updateDownload: (id: string, updates: Partial<DownloadItem>) => void
  removeDownload: (id: string) => void
  setDownloading: (downloading: boolean) => void
  
  // UI
  setViewMode: (mode: 'grid' | 'list') => void
  setSortBy: (sortBy: 'name' | 'date' | 'size' | 'type') => void
  setSortOrder: (order: 'asc' | 'desc') => void
  setFilterCategory: (category: string | null) => void
  setSearchQuery: (query: string) => void
  
  // Filtered documents
  getFilteredDocuments: () => Document[]
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      // Initial state
      documents: [],
      currentDocument: null,
      downloads: [],
      isDownloading: false,
      viewMode: 'grid',
      sortBy: 'date',
      sortOrder: 'desc',
      filterCategory: null,
      searchQuery: '',
      
      // Document actions
      setDocuments: (documents) => set({ documents }),
      
      addDocument: (document) => set((state) => ({
        documents: [document, ...state.documents]
      })),
      
      updateDocument: (id, updates) => set((state) => ({
        documents: state.documents.map(doc => 
          doc.id === id ? { ...doc, ...updates } : doc
        )
      })),
      
      deleteDocument: (id) => set((state) => ({
        documents: state.documents.filter(doc => doc.id !== id),
        currentDocument: state.currentDocument?.id === id ? null : state.currentDocument
      })),
      
      setCurrentDocument: (document) => set({ currentDocument: document }),
      
      // Download actions
      addDownload: (download) => set((state) => ({
        downloads: [...state.downloads, download]
      })),
      
      updateDownload: (id, updates) => set((state) => ({
        downloads: state.downloads.map(download => 
          download.id === id ? { ...download, ...updates } : download
        )
      })),
      
      removeDownload: (id) => set((state) => ({
        downloads: state.downloads.filter(download => download.id !== id)
      })),
      
      setDownloading: (downloading) => set({ isDownloading: downloading }),
      
      // UI actions
      setViewMode: (mode) => set({ viewMode: mode }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (order) => set({ sortOrder: order }),
      setFilterCategory: (category) => set({ filterCategory: category }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      // Filtered documents
      getFilteredDocuments: () => {
        const { documents, searchQuery, filterCategory, sortBy, sortOrder } = get()
        
        let filtered = documents
        
        // Filter by search query
        if (searchQuery) {
          filtered = filtered.filter(doc => 
            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        }
        
        // Filter by category
        if (filterCategory) {
          filtered = filtered.filter(doc => doc.category === filterCategory)
        }
        
        // Sort
        filtered.sort((a, b) => {
          let aValue: any, bValue: any
          
          switch (sortBy) {
            case 'name':
              aValue = a.title.toLowerCase()
              bValue = b.title.toLowerCase()
              break
            case 'date':
              aValue = new Date(a.uploadedAt).getTime()
              bValue = new Date(b.uploadedAt).getTime()
              break
            case 'size':
              aValue = a.fileSize
              bValue = b.fileSize
              break
            case 'type':
              aValue = a.category
              bValue = b.category
              break
            default:
              return 0
          }
          
          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1
          } else {
            return aValue < bValue ? 1 : -1
          }
        })
        
        return filtered
      }
    }),
    {
      name: 'leexdoc-store',
      partialize: (state) => ({
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        filterCategory: state.filterCategory,
        downloads: state.downloads
      })
    }
  )
)
