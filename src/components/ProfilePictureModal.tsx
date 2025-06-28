'use client'

import { useState, useRef, useCallback } from 'react'
import { MdClose, MdCameraAlt, MdDelete, MdUpload } from 'react-icons/md'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'

interface ProfilePictureModalProps {
  isOpen: boolean
  onClose: () => void
  currentProfilePicture?: string
  onUpload: (imageData: string, contentType: string) => Promise<void>
  onRemove: () => Promise<void>
}

export default function ProfilePictureModal({
  isOpen,
  onClose,
  currentProfilePicture,
  onUpload,
  onRemove
}: ProfilePictureModalProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      alert('Format de fichier non supporté. Utilisez JPEG, PNG, WebP ou GIF.')
      return
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('Le fichier est trop volumineux. La taille maximale est de 5MB.')
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleUpload = async () => {
    if (!selectedFile || !preview) return

    setIsUploading(true)
    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        await onUpload(base64String, selectedFile.type)
        onClose()
        setPreview(null)
        setSelectedFile(null)
      }
      reader.readAsDataURL(selectedFile)
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error)
      alert('Erreur lors de l\'upload de l\'image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer votre photo de profil ?')) {
      setIsUploading(true)
      try {
        await onRemove()
        onClose()
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        alert('Erreur lors de la suppression de l\'image')
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleClose = () => {
    setPreview(null)
    setSelectedFile(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Changer la photo de profil
          </h3>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current/Preview Image */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Image
                src={preview || currentProfilePicture || '/default-avatar.png'}
                alt="Photo de profil"
                width={150}
                height={150}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
              />
              {preview && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white rounded-full p-1">
                  <span className="text-xs">Aperçu</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <MdCameraAlt className="w-5 h-5" />
              {preview ? 'Changer l\'image' : 'Choisir une image'}
            </button>

            {/* Confirm Upload Button (only show if there's a preview) */}
            {preview && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                <MdUpload className="w-5 h-5" />
                {isUploading ? 'Upload en cours...' : 'Confirmer l\'upload'}
              </button>
            )}

            {/* Remove Button (only show if user has a profile picture) */}
            {currentProfilePicture && currentProfilePicture !== '/default-avatar.png' && !preview && (
              <button
                onClick={handleRemove}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                <MdDelete className="w-5 h-5" />
                {isUploading ? 'Suppression...' : 'Supprimer la photo'}
              </button>
            )}

            {/* Cancel Button */}
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Annuler
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
          />

          {/* Instructions */}
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            <p>Formats supportés: JPEG, PNG, WebP, GIF</p>
            <p>Taille maximale: 5MB</p>
          </div>
        </div>
      </div>
    </div>
  )
}
