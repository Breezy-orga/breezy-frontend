'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MdImage, MdClose, MdTag } from 'react-icons/md'
import { v4 as uuidv4 } from 'uuid'

interface PostFormProps {
  onPostCreated?: () => void
  parentPostId?: string
  placeholder?: string
}

export default function PostForm({ onPostCreated, parentPostId, placeholder = "Quoi de neuf ?" }: PostFormProps) {
  const [content, setContent] = useState('')
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaData, setMediaData] = useState<{
    filename: string;
    base64: string;
    contentType: string;
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTagInput, setShowTagInput] = useState(false)
  const [tag, setTag] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        if (response.ok) {
          setUser(await response.json())
        }
      } catch {}
    }
    fetchUser()
  }, [])

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        // Récupère la partie base64 sans le préfixe "data:image/jpeg;base64,"
        const base64Result = reader.result as string
        const base64Data = base64Result.split(',')[1]
        
        // Générer un nom de fichier unique
        const filename = `${Date.now()}-${uuidv4().substring(0, 8)}`
        
        // Stocker le media et sa prévisualisation
        setMediaPreview(base64Result) // Conserve le format complet pour l'affichage
        setMediaData({
          filename,
          base64: base64Data,
          contentType: file.type
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeMedia = () => {
    setMediaPreview(null)
    setMediaData(null)
    if (fileInputRef.current) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!content.trim() && !mediaData) || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: content.trim(),
          parentPost: parentPostId,
          media: mediaData ? [mediaData] : [], // Envoi au format tableau attendu par le backend
          tags: tags.length > 0 ? tags : undefined
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la publication')
      }

      setContent('')
      setMediaPreview(null)
      setMediaData(null)
      setTags([])
      setShowTagInput(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      if (onPostCreated) {
        onPostCreated()
      }
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue lors de la publication')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-4 mb-6 border border-gray-100">
      <div className="flex gap-3">
        <Image
<<<<<<< Updated upstream
          src={user && user.username === 'daemon' ? '/me.jpg' : (user?.profilePicture || '/default-avatar.png')}
=======
          src={user?.username === 'daemon' ? '/me.jpg' : (user?.profilePicture || '/default-avatar.svg')}
>>>>>>> Stashed changes
          alt="Votre avatar"
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            maxLength={280}
            className="w-full bg-transparent border-none focus:ring-0 resize-none text-gray-900 placeholder-gray-500"
            rows={3}
          />
          {mediaPreview && (
            <div className="relative mt-2">
              <div className="relative h-40 w-full">
                <Image
                  src={mediaPreview}
                  alt="Preview"
                  fill
                  className="object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeMedia}
                  className="absolute top-1 right-1 bg-gray-800 bg-opacity-50 text-white rounded-full p-1"
                >
                  <MdClose />
                </button>
              </div>
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(tag => (
                <span 
                  key={tag} 
                  className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                >
                  #{tag}
                  <button 
                    type="button" 
                    onClick={() => removeTag(tag)}
                    className="w-4 h-4 rounded-full bg-blue-200 hover:bg-blue-300 flex items-center justify-center text-blue-800"
                  >
                    <MdClose className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {showTagInput && (
            <div className="flex items-center gap-2 mt-3">
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Ajouter un tag (sans #)"
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                Ajouter
              </button>
              <button
                type="button"
                onClick={() => setShowTagInput(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>
          )}
          <div className="mt-4 flex justify-between">
            <div className="flex space-x-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-blue-500 hover:text-blue-600">
                <MdImage className="text-xl" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleMediaChange}
                accept="image/*,video/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => setShowTagInput(!showTagInput)}
                className="text-blue-500 hover:text-blue-600"
              >
                <MdTag className="text-xl" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {content.length}/280
              </span>
              <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
} 