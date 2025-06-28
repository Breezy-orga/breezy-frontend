'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { 
  MdFavorite, 
  MdFavoriteBorder, 
  MdComment, 
  MdShare, 
  MdMoreVert,
  MdDelete,
  MdEdit,
  MdSend,
  MdExpandMore,
  MdExpandLess 
} from 'react-icons/md'

import { Post as PostType, Comment, User, Media } from '@/types/models'
import { useUser } from '@/contexts/UserContext'
import LikeButton from './LikeButton'

// Utility function to get media source URL
const getMediaSrc = (media: Media): string => {
  // If there's a direct URL, use it
  if (media.url) {
    return media.url
  }
  
  // If there's base64 data, convert it to data URL
  if (media.base64 && media.contentType) {
    return `data:${media.contentType};base64,${media.base64}`
  }
  
  // Fallback for legacy data structure
  if ((media as any).data) {
    return (media as any).data
  }
  
  return ''
}

// Utility function to determine media type from contentType or URL
const getMediaType = (media: Media): 'image' | 'video' => {
  // If type is explicitly set, use it
  if (media.type) {
    return media.type
  }
  
  // Determine from contentType
  if (media.contentType) {
    return media.contentType.startsWith('video/') ? 'video' : 'image'
  }
  
  // Determine from URL extension
  if (media.url) {
    const ext = media.url.toLowerCase().split('.').pop()
    if (ext && ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) {
      return 'video'
    }
  }
  
  // Default to image
  return 'image'
}

interface PostProps {
  post: PostType
  currentUser?: User | null
  onLike?: (postId: string, updatedPost: PostType) => void
  onComment?: (postId: string, comment: string) => Promise<void>
  onDelete?: (postId: string) => void
  onEdit?: (postId: string, newContent: string) => void
  onShare?: (post: PostType) => void
  isClickable?: boolean
  showComments?: boolean
  maxCommentsToShow?: number
}

interface CommentComponentProps {
  comment: Comment
  currentUser: User | null
  onReply: (parentId: string, content: string) => Promise<void>
  onLike: (commentId: string) => void
  onDelete?: (commentId: string) => void
  depth?: number
  formatDate: (date: string) => string
}

const CommentComponent: React.FC<CommentComponentProps> = ({
  comment,
  currentUser,
  onReply,
  onLike,
  onDelete,
  depth = 0,
  formatDate
}) => {
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [showReplies, setShowReplies] = useState(depth < 2)
  const { t } = useTranslation()

  const author = typeof comment.author === 'object' ? comment.author : null
  const isOwnComment = currentUser?._id === author?._id
  const likesCount = Array.isArray(comment.likes) ? comment.likes.length : 0
  const isLiked = currentUser && Array.isArray(comment.likes) 
    ? comment.likes.some(like => 
        typeof like === 'string' ? like === currentUser._id : like._id === currentUser._id
      )
    : false

  const handleReply = async () => {
    if (!replyContent.trim()) return
    
    try {
      await onReply(comment._id, replyContent)
      setReplyContent('')
      setIsReplying(false)
    } catch (error) {
      console.error('Error posting reply:', error)
    }
  }

  const marginLeft = Math.min(depth * 20, 60)

  return (
    <div className="border-l-2 border-gray-100" style={{ marginLeft: `${marginLeft}px` }}>
      <div className="flex space-x-3 p-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Image
            src={author?.profilePicture || '/default-avatar.png'}
            alt={author?.username || 'User'}
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <Link 
                href={`/profile/${author?._id}`}
                className="font-semibold text-sm text-gray-900 hover:text-blue-600"
              >
                {author?.displayName || author?.username}
              </Link>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {formatDate(comment.createdAt)}
                </span>
                {isOwnComment && onDelete && (
                  <button
                    onClick={() => onDelete(comment._id)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <MdDelete size={14} />
                  </button>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-800 whitespace-pre-wrap">
              {comment.content}
            </p>

            {/* Comment Media */}
            {comment.medias && comment.medias.length > 0 && (
              <div className="mt-2 grid gap-2" 
                   style={{ gridTemplateColumns: `repeat(${Math.min(comment.medias.length, 2)}, 1fr)` }}>
                {comment.medias.map((media, index) => {
                  const mediaSrc = getMediaSrc(media)
                  if (!mediaSrc) return null
                  
                  const mediaType = getMediaType(media)
                  
                  return (
                    <div key={index} className="relative rounded-lg overflow-hidden">
                      {mediaType === 'image' ? (
                        <Image
                          src={mediaSrc}
                          alt={media.alt || 'Comment image'}
                          width={200}
                          height={200}
                          className="w-full h-auto object-cover"
                        />
                      ) : (
                        <video
                          src={mediaSrc}
                          controls
                          className="w-full h-auto rounded-lg"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center space-x-4 mt-2 text-sm">
            <button
              onClick={() => onLike(comment._id)}
              className={`flex items-center space-x-1 hover:text-red-500 transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-500'
              }`}
            >
              {isLiked ? <MdFavorite size={16} /> : <MdFavoriteBorder size={16} />}
              <span>{likesCount}</span>
            </button>

            <button
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <MdComment size={16} />
              <span>{t('post.reply')}</span>
            </button>

            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
              >
                {showReplies ? <MdExpandLess size={16} /> : <MdExpandMore size={16} />}
                <span>{comment.replies.length} {t('post.replies')}</span>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3 flex space-x-2">
              <Image
                src={currentUser?.profilePicture || '/default-avatar.png'}
                alt="Your avatar"
                width={24}
                height={24}
                className="rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 flex space-x-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={t('post.writeReply')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                />
                <button
                  onClick={handleReply}
                  disabled={!replyContent.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <MdSend size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Nested Replies */}
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map((reply) => (
                <CommentComponent
                  key={reply._id}
                  comment={reply}
                  currentUser={currentUser}
                  onReply={onReply}
                  onLike={onLike}
                  onDelete={onDelete}
                  depth={depth + 1}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const Post: React.FC<PostProps> = ({
  post,
  currentUser: propCurrentUser,
  onLike,
  onComment,
  onDelete,
  onEdit,
  onShare,
  isClickable = true,
  showComments = true,
  maxCommentsToShow = 3
}) => {
  const { user: contextUser } = useUser()
  const currentUser = propCurrentUser || contextUser
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAllComments, setShowAllComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [localPost, setLocalPost] = useState(post)
  const router = useRouter()
  const { t } = useTranslation()

  // Update local post when prop changes
  useEffect(() => {
    setLocalPost(post)
  }, [post])

  const author = typeof localPost.author === 'object' ? localPost.author : null
  const isOwnPost = currentUser?._id === author?._id
  const likesCount = Array.isArray(localPost.likes) ? localPost.likes.length : 0
  const commentsArray = Array.isArray(localPost.comments) 
    ? localPost.comments.filter(c => typeof c === 'object') as Comment[]
    : []
  const commentsCount = commentsArray.length

  const isLiked = currentUser && Array.isArray(localPost.likes) 
    ? localPost.likes.some(like => 
        typeof like === 'string' ? like === currentUser._id : like._id === currentUser._id
      )
    : false

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return t('time.justNow')
    if (diffInSeconds < 3600) return t('time.minutesAgo', { count: Math.floor(diffInSeconds / 60) })
    if (diffInSeconds < 86400) return t('time.hoursAgo', { count: Math.floor(diffInSeconds / 3600) })
    if (diffInSeconds < 604800) return t('time.daysAgo', { count: Math.floor(diffInSeconds / 86400) })
    
    return date.toLocaleDateString()
  }

  const handlePostClick = () => {
    if (isClickable && !isExpanded) {
      router.push(`/post/${localPost._id}`)
    }
  }

  const handleLike = async () => {
    if (!currentUser) return

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      const response = await fetch(`${apiBaseUrl}/posts/${localPost._id}/like`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const updatedPost = await response.json()
        setLocalPost(updatedPost)
        if (onLike) {
          onLike(localPost._id, updatedPost)
        }
      }
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleShare = async () => {
    // If onShare prop is provided, use it
    if (onShare) {
      onShare(localPost)
      return
    }

    // Otherwise, use the default sharing behavior
    const url = `${window.location.origin}/post/${localPost._id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${author?.displayName || author?.username}'s post`,
          text: localPost.content,
          url: url
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url)
        // You could show a toast notification here
        alert(t('post.linkCopied'))
      } catch (error) {
        console.error('Error copying to clipboard:', error)
      }
    }
  }

  const handleCommentLike = async (commentId: string) => {
    if (!currentUser) return

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      const response = await fetch(`${apiBaseUrl}/comments/${commentId}/like`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        // Refresh post to get updated comments
        const postResponse = await fetch(`${apiBaseUrl}/posts/${localPost._id}`, {
          credentials: 'include'
        })
        if (postResponse.ok) {
          const updatedPost = await postResponse.json()
          setLocalPost(updatedPost)
        }
      }
    } catch (error) {
      console.error('Error liking comment:', error)
    }
  }

  const handleReply = async (parentId: string, content: string) => {
    if (!currentUser) return

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      const response = await fetch(`${apiBaseUrl}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          parentPost: localPost._id,
          parentComment: parentId
        })
      })

      if (response.ok) {
        // Refresh post to get updated comments
        const postResponse = await fetch(`${apiBaseUrl}/posts/${localPost._id}`, {
          credentials: 'include'
        })
        if (postResponse.ok) {
          const updatedPost = await postResponse.json()
          setLocalPost(updatedPost)
        }
      }
    } catch (error) {
      console.error('Error posting reply:', error)
    }
  }

  const visibleComments = showAllComments 
    ? commentsArray 
    : commentsArray.slice(0, maxCommentsToShow)

  return (
    <article className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Post Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/profile/${author?._id}`}>
              <Image
                src={author?.profilePicture || '/default-avatar.png'}
                alt={author?.username || 'User'}
                width={48}
                height={48}
                className="rounded-full object-cover hover:opacity-80 transition-opacity"
              />
            </Link>
            <div>
              <Link 
                href={`/profile/${author?._id}`}
                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {author?.displayName || author?.username}
              </Link>
              {author?.isVerified && (
                <span className="ml-1 text-blue-500" title="Verified">✓</span>
              )}
              <p className="text-sm text-gray-500">
                {formatDate(localPost.createdAt)}
              </p>
            </div>
          </div>
          
          {/* Post Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <MdMoreVert size={20} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                {isOwnPost && onEdit && (
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      // Implement edit functionality
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <MdEdit size={16} />
                    <span>{t('post.edit')}</span>
                  </button>
                )}
                {isOwnPost && onDelete && (
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      onDelete(localPost._id)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <MdDelete size={16} />
                    <span>{t('post.delete')}</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false)
                    handleShare()
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <MdShare size={16} />
                  <span>{t('post.share')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div 
        className={`px-4 ${isClickable ? 'cursor-pointer' : ''}`}
        onClick={handlePostClick}
      >
        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
          {localPost.content}
        </p>

        {/* Post Tags */}
        {localPost.tags && localPost.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {localPost.tags.map((tag, index) => (
              <span
                key={index}
                className="text-blue-500 hover:text-blue-600 cursor-pointer text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Post Media */}
        {localPost.medias && localPost.medias.length > 0 && (
          <div className="mt-3">
            <div 
              className={`grid gap-2 rounded-lg overflow-hidden ${
                localPost.medias.length === 1 
                  ? 'grid-cols-1' 
                  : localPost.medias.length === 2 
                  ? 'grid-cols-2' 
                  : 'grid-cols-2'
              }`}
            >
              {localPost.medias.map((media, index) => {
                const mediaSrc = getMediaSrc(media)
                if (!mediaSrc) return null
                
                const mediaType = getMediaType(media)
                
                return (
                  <div key={index} className="relative group">
                    {mediaType === 'image' ? (
                      <Image
                        src={mediaSrc}
                        alt={media.alt || 'Post image'}
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover rounded-lg group-hover:opacity-95 transition-opacity"
                      />
                    ) : (
                      <video
                        src={mediaSrc}
                        controls
                        className="w-full h-auto rounded-lg"
                        preload="metadata"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 hover:text-red-500 transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            {isLiked ? <MdFavorite size={20} /> : <MdFavoriteBorder size={20} />}
            <span className="text-sm font-medium">{likesCount}</span>
          </button>

          <button
            onClick={() => router.push(`/post/${localPost._id}`)}
            className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <MdComment size={20} />
            <span className="text-sm font-medium">{commentsCount}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && commentsArray.length > 0 && (
        <div className="border-t border-gray-100">
          {visibleComments.map((comment) => (
            <CommentComponent
              key={comment._id}
              comment={comment}
              currentUser={currentUser}
              onReply={handleReply}
              onLike={handleCommentLike}
              onDelete={onDelete}
              formatDate={formatDate}
            />
          ))}

          {commentsArray.length > maxCommentsToShow && !showAllComments && (
            <div className="p-4 text-center">
              <button
                onClick={() => setShowAllComments(true)}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                {t('post.viewAllComments', { count: commentsArray.length - maxCommentsToShow })}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

export default Post

// Additional components for compatibility with existing pages

export interface ThreadItemProps {
  item: PostType | Comment
  currentUser: User | null
  formatDate: (date: string) => string
  repliesCount?: number
  onReply?: (e: React.MouseEvent) => void
  replyingCommentId?: string | null
  setReplyingCommentId?: (id: string | null) => void
  children?: React.ReactNode
  onLike?: (postId: string, updatedPost: PostType | Comment) => void
  onComment?: (postId: string, comment: string) => Promise<void>
  onDelete?: (postId: string) => void
  onEdit?: (updatedItem: PostType | Comment) => void
  onShare?: (post: PostType) => void
  isComment?: boolean
  isReply?: boolean
  isClickable?: boolean
}

export const ThreadItem: React.FC<ThreadItemProps> = ({
  item,
  currentUser,
  formatDate,
  repliesCount = 0,
  onReply,
  replyingCommentId,
  setReplyingCommentId,
  onLike,
  onComment,
  onDelete,
  onEdit,
  onShare,
  isComment = false,
  isReply = false,
  isClickable = true
}) => {
  // Use the main Post component for posts, or a simplified version for comments
  if (!isComment && 'author' in item) {
    // Create an adapter for the onEdit function to match Post's signature
    const handlePostEdit = onEdit ? (postId: string, newContent: string) => {
      // For now, we'll need to handle this differently since we only have the post ID
      // This would typically require fetching the updated post or handling the update differently
      console.warn('Post editing not fully implemented in ThreadItem')
    } : undefined

    return (
      <Post
        post={item as PostType}
        currentUser={currentUser}
        onLike={onLike}
        onComment={onComment}
        onDelete={onDelete}
        onEdit={handlePostEdit}
        onShare={onShare}
        isClickable={isClickable}
        showComments={false}
      />
    )
  }

  // For comments, use the CommentComponent
  const comment = item as Comment
  
  const handleCommentLike = async (commentId: string) => {
    if (onLike) {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
        const response = await fetch(`${apiBaseUrl}/comments/${commentId}/like`, {
          method: 'POST',
          credentials: 'include'
        })

        if (response.ok) {
          const updatedComment = await response.json()
          onLike(commentId, updatedComment)
        }
      } catch (error) {
        console.error('Error liking comment:', error)
      }
    }
  }

  const handleReply = async (parentId: string, content: string) => {
    if (onComment) {
      await onComment(parentId, content)
    }
  }

  return (
    <CommentComponent
      comment={comment}
      currentUser={currentUser}
      onReply={handleReply}
      onLike={handleCommentLike}
      onDelete={onDelete}
      formatDate={formatDate}
      depth={0}
    />
  )
}

export interface FlatCommentsProps {
  parentId: string
  formatDate: (date: string) => string
  allComments: Comment[]
  replyingCommentId: string | null
  setReplyingCommentId: (id: string | null) => void
  onLike?: (postId: string, updatedPost: PostType | Comment) => void
  onComment?: (postId: string, comment: string) => Promise<void>
  onDelete?: (postId: string) => void
  onEdit?: (updatedItem: PostType | Comment) => void
  expandedComments?: Array<{ id: string; maxDisplayed: number }>
  setExpandedComments?: React.Dispatch<React.SetStateAction<Array<{ id: string; maxDisplayed: number }>>>
  currentUser: User | null
}

export const FlatComments: React.FC<FlatCommentsProps> = ({
  parentId,
  formatDate,
  allComments,
  replyingCommentId,
  setReplyingCommentId,
  onLike,
  onComment,
  onDelete,
  onEdit,
  expandedComments = [],
  setExpandedComments,
  currentUser
}) => {
  const { t } = useTranslation()

  // Filter comments that belong to this parent
  const directComments = allComments.filter(comment => 
    comment.parentPost === parentId || comment.parentComment === parentId
  )

  const handleCommentLike = async (commentId: string) => {
    if (onLike) {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
        const response = await fetch(`${apiBaseUrl}/comments/${commentId}/like`, {
          method: 'POST',
          credentials: 'include'
        })

        if (response.ok) {
          const updatedComment = await response.json()
          onLike(commentId, updatedComment)
        }
      } catch (error) {
        console.error('Error liking comment:', error)
      }
    }
  }

  const handleReply = async (commentParentId: string, content: string) => {
    if (onComment) {
      await onComment(commentParentId, content)
    }
  }

  if (directComments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('post.noComments')}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {directComments.map((comment) => (
        <ThreadItem
          key={comment._id}
          item={comment}
          currentUser={currentUser}
          formatDate={formatDate}
          repliesCount={0}
          onLike={onLike}
          onComment={onComment}
          onDelete={onDelete}
          onEdit={onEdit}
          isComment={true}
          isClickable={false}
        />
      ))}
    </div>
  )
}
