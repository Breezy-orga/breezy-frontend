'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/context/CurrentUserContext'
import Image from 'next/image'
import { MdImage, MdClose, MdTag } from 'react-icons/md'
import { v4 as uuidv4 } from 'uuid'
import { debounce } from 'lodash'
import { Post as PostType } from '@/types/models'

interface PostFormProps {
  onPostCreated?: (newPost: PostType) => void
  parentPostId?: string
  placeholder?: string
}

export default function PostForm({ onPostCreated, parentPostId, parentCommentId, placeholder, autoFocus = false, className }: PostFormProps) {
  const { t } = useTranslation()
  const effectivePlaceholder = placeholder || t("post.placeholder")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [content, setContent] = useState('')
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [mediaTypes, setMediaTypes] = useState<('image' | 'video')[]>([])
  const [mediaData, setMediaData] = useState<{
    filename: string;
    base64: string;
    contentType: string;
  }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTagInput, setShowTagInput] = useState(false)
  const [tag, setTag] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { user } = useUser()

  // Autofocus si demandé
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!content.trim() && !mediaData) || isSubmitting) return

    setIsSubmitting(true)
    let newPost
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBaseUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          content: content.trim(),
          parentPost: parentPostId,
          media: mediaData,
          tags: tags.length > 0 ? tags : undefined
        })
      })
      if (!response.ok) {
        throw new Error('Erreur lors de la publication')
      }
      newPost = await response.json()
    }catch (error) {
      alert('erreur lors de la création')}
    try{
      setContent('')
      setMediaPreviews([])
      setMediaData([])
      setMediaTypes([]) // Réinitialiser les types de média
      setTags([])
      setShowTagInput(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      if (onPostCreated) {
        onPostCreated(newPost)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue lors de la publication')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    const file = files[0]
    
    // Vérifier si le nombre maximum de médias a été atteint
    if (mediaData.length >= 4) {
      alert('Maximum 4 médias par publication')
      return
    }
    
    if (file) {
      // Déterminer si c'est une image ou une vidéo
      const isVideo = file.type.startsWith('video/')
      
      if (isVideo) {
        // Pour les vidéos, créer une preview
        const videoUrl = URL.createObjectURL(file)
        setMediaPreviews(prev => [...prev, videoUrl])
        setMediaTypes(prev => [...prev, 'video'])
      } else {
        // Pour les images, créer une preview
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          setMediaPreviews(prev => [...prev, result])
        }
        reader.readAsDataURL(file)
        setMediaTypes(prev => [...prev, 'image'])
      }

      // Convertir le fichier en base64 pour l'upload
      const fileReader = new FileReader()
      fileReader.onload = () => {
        const base64 = fileReader.result as string
        const base64Data = base64.split(',')[1] // Retirer le préfixe data:image/...;base64,
        
        setMediaData(prev => [...prev, {
          filename: `${uuidv4()}_${file.name}`,
          base64: base64Data,
          contentType: file.type
        }])
      }
      fileReader.readAsDataURL(file)
    }
  }

  const removeMedia = (index: number) => {
    const newPreviews = [...mediaPreviews]
    const newData = [...mediaData]
    const newTypes = [...mediaTypes]
    newPreviews.splice(index, 1)
    newData.splice(index, 1)
    newTypes.splice(index, 1)
    setMediaPreviews(newPreviews)
    setMediaData(newData)
    setMediaTypes(newTypes)
    
    if (newData.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const addTag = () => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()])
      setTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  return (
    <div className={`space-y-4 ${className || ''}`}>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6 border border-gray-100 dark:border-gray-700">
        <div className="flex gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden">
            <Image
              src={user?.profilePicture || '/default-avatar.png'}
              alt="Votre avatar"
              width={40}
              height={40}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/default-avatar.png'
              }}
            />
          </div>
          
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={effectivePlaceholder}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              maxLength={280}
            />
            
            {/* Affichage des tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tagItem, index) => (
                  <span key={index} className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                    #{tagItem}
                    <button
                      type="button"
                      onClick={() => removeTag(tagItem)}
                      className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                    >
                      <MdClose size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input pour ajouter des tags */}
            {showTagInput && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder={t('post.tag_placeholder')}
                  className="flex-1 p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {t('post.add')}
                </button>
              </div>
            )}
            
            {/* Aperçu des médias */}
            {mediaPreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {mediaPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    {mediaTypes[index] === 'video' ? (
                      <video 
                        src={preview} 
                        className="w-full h-32 object-cover rounded-lg"
                        controls
                      />
                    ) : (
                      <Image
                        src={preview}
                        alt={`Media ${index + 1}`}
                        width={200}
                        height={128}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MdClose />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Barre d'actions */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={mediaData.length >= 4}
                  className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('post.add_media')}
                >
                  <MdImage size={20} />
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowTagInput(!showTagInput)}
                  className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                  title={t('post.add_tag')}
                >
                  <MdTag size={20} />
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {content.length}/280
                </span>
                <button
                  type="submit"
                  disabled={(!content.trim() && mediaData.length === 0) || isSubmitting}
                  className="px-6 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t('post.publishing') : t('post.publish')}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*"
          className="hidden"
          multiple={false}
        />
      </form>
    </div>
  )
}
