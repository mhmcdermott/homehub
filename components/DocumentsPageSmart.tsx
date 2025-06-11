import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, Sparkles, CheckCircle, AlertCircle, Mail } from 'lucide-react'
import { Category } from '@prisma/client'
import { motion, AnimatePresence } from 'framer-motion'

interface UploadedDocument {
  id: string
  filename: string
  category: Category
  description: string
  autoProcessed: boolean
  confidence?: number
}

export default function DocumentsPageSmart() {
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([])
  const [autoCategize, setAutoCategize] = useState(true)
  const [emailAddress, setEmailAddress] = useState('homehub@markmcdermott.me.uk')
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [lastCheck, setLastCheck] = useState<string | null>(null)

  const checkEmailNow = async () => {
    setCheckingEmail(true)
    try {
      const response = await fetch('/api/email/check-now', {
        method: 'POST'
      })
      const result = await response.json()
      
      if (result.success) {
        setLastCheck(result.summary.message)
        // Refresh the page to show new documents
        if (result.summary.totalDocuments > 0) {
          setTimeout(() => window.location.reload(), 2000)
        }
      }
    } catch (error) {
      console.error('Email check failed:', error)
      setLastCheck('Failed to check email')
    } finally {
      setCheckingEmail(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(prev => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return
    
    setUploading(true)
    const uploaded: UploadedDocument[] = []

    for (const file of selectedFiles) {
      const data = new FormData()
      data.append('file', file)
      data.append('autoCategize', autoCategize.toString())

      try {
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: data,
        })

        if (response.ok) {
          const doc = await response.json()
          uploaded.push(doc)
        }
      } catch (error) {
        console.error('Upload error:', error)
      }
    }

    setUploadedDocs(uploaded)
    setSelectedFiles([])
    setUploading(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Smart Document Upload</h2>
        <p className="text-gray-600">
          Upload documents and let AI categorize them automatically, or email them directly!
        </p>
      </div>

      {/* Email Instructions Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-6 mb-8 shadow-lg"
      >
        <div className="flex items-start space-x-4">
          <Mail className="h-8 w-8 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Email Documents Directly!</h3>
            <p className="text-purple-100 mb-3">
              Forward any email with attachments to your secure HomeHub address:
            </p>
            <div className="bg-white/20 backdrop-blur-sm rounded p-3 font-mono text-sm">
              {emailAddress}
            </div>
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-xs text-purple-200">
                  🔒 Only accepts emails from your approved addresses
                </p>
                <p className="text-xs text-purple-300">
                  Unauthorized emails are automatically deleted
                </p>
              </div>
              <button
                onClick={checkEmailNow}
                disabled={checkingEmail}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50"
              >
                {checkingEmail ? 'Checking...' : 'Check Now'}
              </button>
            </div>
            {lastCheck && (
              <p className="text-xs text-purple-200 mt-2 bg-white/10 rounded p-2">
                {lastCheck}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Upload Interface */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Manual Upload</h3>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoCategize}
              onChange={(e) => setAutoCategize(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 flex items-center">
              <Sparkles className="h-4 w-4 mr-1 text-purple-600" />
              AI Auto-Categorization
            </span>
          </label>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600">
            {isDragActive
              ? 'Drop the files here'
              : 'Drag and drop files here, or click to select'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Multiple files supported • Max 10MB each
          </p>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Selected Files ({selectedFiles.length})
            </h4>
            <AnimatePresence>
              {selectedFiles.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full mt-4 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing with AI...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Upload Results */}
      {uploadedDocs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            Upload Complete!
          </h3>
          <div className="space-y-3">
            {uploadedDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                    <p className="text-xs text-gray-500">
                      {doc.category} • {doc.description}
                    </p>
                  </div>
                </div>
                {doc.autoProcessed && (
                  <div className="flex items-center text-xs text-purple-600">
                    <Sparkles className="h-4 w-4 mr-1" />
                    AI Processed
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setUploadedDocs([])}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700"
          >
            Upload More Documents
          </button>
        </motion.div>
      )}
    </div>
  )
}