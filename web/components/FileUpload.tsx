'use client'

import { useDropzone } from 'react-dropzone'
import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react'

interface FileUploadProps {
  onUploadSuccess?: (data: any) => void
  onUploadError?: (error: string) => void
}

export default function FileUpload({ onUploadSuccess, onUploadError }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    setUploadStatus('idle')
    const file = acceptedFiles[0]
    setUploadedFile(file)
    
    try {
      // Get current session
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No valid session found. Please log in again.')
      }
      
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload/pdf`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        }
      )
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || `Upload failed: ${response.status}`)
      }
      
      setUploadStatus('success')
      setUploadMessage(`Successfully uploaded ${file.name}`)
      onUploadSuccess?.(data)
      
    } catch (error) {
      console.error('Upload failed:', error)
      setUploadStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setUploadMessage(errorMessage)
      onUploadError?.(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10485760, // 10MB
    multiple: false
  })

  const resetUpload = () => {
    setUploadStatus('idle')
    setUploadMessage('')
    setUploadedFile(null)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 
            uploadStatus === 'success' ? 'border-green-500 bg-green-50' :
            uploadStatus === 'error' ? 'border-red-500 bg-red-50' :
            'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg font-medium text-gray-900">Uploading PDF...</p>
            <p className="text-sm text-gray-500 mt-2">Processing {uploadedFile?.name}</p>
          </div>
        ) : uploadStatus === 'success' ? (
          <div className="flex flex-col items-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium text-green-900">Upload Successful!</p>
            <p className="text-sm text-green-700 mt-2">{uploadMessage}</p>
            <button
              onClick={resetUpload}
              className="mt-4 px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              Upload Another File
            </button>
          </div>
        ) : uploadStatus === 'error' ? (
          <div className="flex flex-col items-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-medium text-red-900">Upload Failed</p>
            <p className="text-sm text-red-700 mt-2">{uploadMessage}</p>
            <button
              onClick={resetUpload}
              className="mt-4 px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? 'Drop your PDF here' : 'Upload PDF File'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {isDragActive 
                ? 'Release to upload' 
                : 'Drag & drop a PDF file here, or click to select'
              }
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span className="flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                PDF only
              </span>
              <span>Max 10MB</span>
            </div>
          </div>
        )}
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-medium text-red-900 mb-2">File Rejected:</h4>
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="text-sm text-red-700">
              <p className="font-medium">{file.name}</p>
              <ul className="list-disc list-inside ml-2">
                {errors.map(error => (
                  <li key={error.code}>
                    {error.code === 'file-too-large' ? 'File is larger than 10MB' :
                     error.code === 'file-invalid-type' ? 'Only PDF files are allowed' :
                     error.message}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Upload Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Supported PDF Formats:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Google Ads spend reports</li>
          <li>• Facebook Ads spend reports</li>
          <li>• Custom advertising spend statements</li>
          <li>• Files must contain campaign names and spend amounts</li>
        </ul>
      </div>
    </div>
  )
}