'use client'

import { useState, useEffect } from 'react'
import { MdFavorite, MdFavoriteBorder } from 'react-icons/md'

interface LikeButtonProps {
  itemId: string
  itemType: 'post' | 'comment'
  parentId?: string
  initialLikes: number
  initialLikedStatus: boolean
  onLikeSuccess?: (update: { liked: boolean; totalLikes: number }) => void;
  size?: 'small' | 'normal'
}

export default function LikeButton({
  itemId,
  itemType,
  parentId,
  initialLikes,
  initialLikedStatus,
  onLikeSuccess,
  size = 'normal',
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLikedStatus)
  const [likesCount, setLikesCount] = useState(initialLikes)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    setIsLiked(initialLikedStatus)
    setLikesCount(initialLikes)
  }, [initialLikedStatus, initialLikes])

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isProcessing) return
    setIsProcessing(true)

    const endpoint = `/api/posts/${itemId}/like`

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`Status ${res.status}`)

      const { liked, totalLikes } = await res.json() as {
        liked: boolean
        totalLikes: number
      } 
      setIsLiked(liked)
      setLikesCount(totalLikes)
      onLikeSuccess?.({ liked, totalLikes });

    } catch (err) {
      console.error('Like error', err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={isProcessing}
      aria-label={isLiked ? 'Retirer le like' : 'Aimer'}
      title={isLiked ? 'Retirer le like' : 'Aimer'}
      className={`
        flex items-center gap-1 fill-current
        ${isLiked ? 'text-red-500 dark:text-red-500' : 'text-gray-500 dark:text-gray-400'}
        ${size === 'small' ? 'text-sm' : 'text-base'}
        ${isProcessing ? 'opacity-70' : ''}
      `}
    >
      {isLiked
        ? <MdFavorite size={size === 'small' ? 16 : 20} />
        : <MdFavoriteBorder size={size === 'small' ? 16 : 20} />
      }
      <span>{likesCount}</span>
    </button>
  )
}
