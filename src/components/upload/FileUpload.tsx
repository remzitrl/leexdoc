'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, File, X, Shield } from 'lucide-react'
import { useDocumentStore } from '@/lib/document-store'
import { offlineManager } from '@/lib/offline/manager'

interface FileUploadProps {
  onClose: () => void
}

export default function FileUpload({ onClose }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tosAccepted, setTosAccepted] = useState(false)
  const [documentTitle, setDocumentTitle] = useState('')
  const [documentDescription, setDocumentDescription] = useState('')
  const [documentCategory, setDocumentCategory] = useState<string>('')
  const [documentTags, setDocumentTags] = useState('')
  const [autoDownload, setAutoDownload] = useState(true)
  const { addDocument } = useDocumentStore()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError('')
    setSuccess('')
    
    // Validate files
    const maxFileSize = 100 * 1024 * 1024 // 100MB
    const validFiles = acceptedFiles.filter(file => {
      if (file.size > maxFileSize) {
        setError(`Dosya çok büyük: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setUploadedFiles(prev => [...prev, ...validFiles])
    
    // Auto-fill title if not set
    if (!documentTitle && validFiles.length === 1) {
      setDocumentTitle(validFiles[0].name.replace(/\.[^/.]+$/, ''))
    }
  }, [documentTitle])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.mkv'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
      'application/zip': ['.zip', '.rar', '.7z'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'application/rtf': ['.rtf']
    },
    multiple: true
  })

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getCategoryFromMimeType = (mimeType: string): string => {
    if (mimeType.startsWith('application/pdf')) return 'PDF'
    if (mimeType.startsWith('audio/')) return 'Audio'
    if (mimeType.startsWith('video/')) return 'Video'
    if (mimeType.startsWith('image/')) return 'Image'
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'Archive'
    if (mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('text')) return 'Document'
    return 'Other'
  }

  const uploadFiles = async () => {
    if (uploadedFiles.length === 0) return

    if (!tosAccepted) {
      setError('Kullanım şartlarını kabul etmelisiniz')
      return
    }

    if (!documentTitle.trim()) {
      setError('Belge başlığı gereklidir')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      uploadedFiles.forEach(file => {
        formData.append('files', file)
      })
      
      formData.append('title', documentTitle)
      formData.append('description', documentDescription)
      formData.append('category', documentCategory || getCategoryFromMimeType(uploadedFiles[0].type))
      formData.append('tags', documentTags)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Yükleme başarısız')
      }

      // Add to store
      data.documents.forEach((doc: any) => {
        addDocument(doc)
      })

      // Auto-download for offline access if enabled
      if (autoDownload) {
        try {
          for (const doc of data.documents) {
            try {
              await offlineManager.saveDocumentForOffline(doc.id)
              console.log(`Auto-downloaded document: ${doc.title}`)
            } catch (downloadError) {
              console.warn(`Failed to auto-download document ${doc.title}:`, downloadError)
            }
          }
        } catch (error) {
          console.warn('Some documents failed to auto-download:', error)
        }
      }

      setSuccess(`${uploadedFiles.length} dosya başarıyla yüklendi${autoDownload ? ' ve offline erişim için indirildi' : ''}`)
      setUploadedFiles([])
      setDocumentTitle('')
      setDocumentDescription('')
      setDocumentCategory('')
      setDocumentTags('')
      setTosAccepted(false)
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Yükleme başarısız')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium mb-2">
          {isDragActive ? 'Dosyaları buraya bırakın' : 'Dosyaları sürükleyip bırakın'}
        </p>
        <p className="text-gray-500 mb-4">
          veya tıklayarak seçin
        </p>
        <Button variant="outline" type="button">
          Dosya Seç
        </Button>
        <p className="text-sm text-gray-500 mt-2">
          PDF, MP3, MP4, Resim, Belge ve daha fazlası (Max 100MB)
        </p>
      </div>

      {/* Document Metadata */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium">Belge Bilgileri</h3>
          
          <div>
            <Label htmlFor="title">Başlık *</Label>
            <Input
              id="title"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Belge başlığı"
            />
          </div>

          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={documentDescription}
              onChange={(e) => setDocumentDescription(e.target.value)}
              placeholder="Belge açıklaması (isteğe bağlı)"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="category">Kategori</Label>
            <Select value={documentCategory} onValueChange={setDocumentCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="Audio">Ses</SelectItem>
                <SelectItem value="Video">Video</SelectItem>
                <SelectItem value="Image">Resim</SelectItem>
                <SelectItem value="Document">Belge</SelectItem>
                <SelectItem value="Archive">Arşiv</SelectItem>
                <SelectItem value="Other">Diğer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tags">Etiketler</Label>
            <Input
              id="tags"
              value={documentTags}
              onChange={(e) => setDocumentTags(e.target.value)}
              placeholder="etiket1, etiket2, etiket3"
            />
            <p className="text-xs text-gray-500 mt-1">Virgülle ayırarak birden fazla etiket ekleyebilirsiniz</p>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="auto-download"
              checked={autoDownload}
              onCheckedChange={(checked) => setAutoDownload(checked as boolean)}
            />
            <Label htmlFor="auto-download" className="text-sm leading-relaxed">
              Dosyaları otomatik olarak offline erişim için indir (önerilen)
            </Label>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Seçilen Dosyalar ({uploadedFiles.length})</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white border rounded">
                <div className="flex items-center gap-2">
                  <File className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terms of Service */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="tos"
              checked={tosAccepted}
              onCheckedChange={(checked) => setTosAccepted(checked as boolean)}
            />
            <Label htmlFor="tos" className="text-sm leading-relaxed">
              Yüklediğim dosyaların sahibi olduğumu ve bu platforma yükleme yetkim olduğunu onaylıyorum. 
              Telif hakkı olan materyalleri izinsiz yüklemenin hesap kapatılması ve yasal işlemle sonuçlanabileceğini anlıyorum.
            </Label>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {uploadedFiles.length > 0 && (
        <div className="flex gap-2">
          <Button 
            onClick={uploadFiles} 
            disabled={uploading || !tosAccepted || !documentTitle.trim()}
            className="flex-1"
          >
            {uploading ? 'Yükleniyor...' : `${uploadedFiles.length} dosyayı yükle`}
          </Button>
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
        </div>
      )}
    </div>
  )
}