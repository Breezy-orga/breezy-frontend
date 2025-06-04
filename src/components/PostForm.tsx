'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MdImage, MdGif, MdEmojiEmotions } from 'react-icons/md'

interface PostFormProps {
  onPostCreated?: () => void
  parentPostId?: string
  placeholder?: string
}

export default function PostForm({ onPostCreated, parentPostId, placeholder = "Quoi de neuf ?" }: PostFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        if (response.ok) {
          setUser(await response.json())
        }
      } catch {}
    }
    fetchUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: content.trim(),
          parentPost: parentPostId
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la publication')
      }

      setContent('')
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
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 mb-6 border border-gray-100 dark:border-gray-800">
      <div className="flex gap-3">
        <Image
          src={user?.username === 'daemon' ? '/me.jpg' : (user?.profilePicture || '/default-avatar.png')}
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
            className="w-full bg-transparent border-none focus:ring-0 resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            rows={3}
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex gap-2">
              <button
                type="button"
                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <MdImage className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <MdGif className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <MdEmojiEmotions className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
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