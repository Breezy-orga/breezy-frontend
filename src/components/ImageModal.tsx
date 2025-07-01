'use client'

import { useState, useEffect } from 'react'
import { MdClose } from 'react-icons/md'

interface MediaModalProps {
  src: string
  alt?: string
  isOpen: boolean
  onClose: () => void
  mediaType?: 'image' | 'video'
}

export default function MediaModal({ src, alt, isOpen, onClose, mediaType = 'image' }: MediaModalProps) {
  // Gérer la fermeture avec la touche Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full">
        {/* Bouton de fermeture */}
        <button 
          className="absolute top-4 right-4 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70"
          onClick={onClose}
        >
          <MdClose className="w-6 h-6" />
        </button>
        
        {/* Media content - image ou vidéo */}
        {mediaType === 'image' ? (
          <img 
            src={src} 
            alt={alt || "Image en plein écran"} 
            className="max-h-[90vh] max-w-full object-contain mx-auto"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <video 
            src={src}
            controls
            autoPlay
            className="max-h-[90vh] max-w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            Votre navigateur ne prend pas en charge la lecture de vidéos.
          </video>
        )}
      </div>
    </div>
  )
}