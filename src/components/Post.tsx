'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MdFavorite, MdFavoriteBorder, MdChatBubbleOutline, MdShare, MdMoreHoriz, MdRepeat } from 'react-icons/md'
import PostForm from './PostForm'

interface PostProps {
  post: {
    _id: string
    content: string
    author: {
      _id: string
      username: string
      name: string
      profilePicture: string
    }
    likes: string[]
    comments: Array<{
      _id: string
      content: string
      author: {
        _id: string
        username: string
        name: string
        profilePicture: string
      }
      createdAt: string
    }>
    createdAt: string
  }
  onLike?: () => void
  onComment?: () => void
  isClickable?: boolean
}

export default function Post({ post, onLike, onComment, isClickable = true }: PostProps) {
  const [showCommentForm, setShowCommentForm] = useState(false)
  const getUserId = () => localStorage.getItem('userId') || ''
  const isLikedByUser = (likes: any[]) => likes.some(like => (like._id || like) === getUserId())
  const [isLiked, setIsLiked] = useState(isLikedByUser(post.likes))
  const [likesCount, setLikesCount] = useState(post.likes.length)
  const [comments, setComments] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null)
  const clickableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showCommentForm) {
      fetchComments()
    }
  }, [showCommentForm])

  useEffect(() => {
    setIsLiked(isLikedByUser(post.likes))
  }, [post.likes])

  const fetchComments = async () => {
    setLoadingComments(true)
    setCommentsError(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post._id}/comments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Erreur lors du chargement des commentaires')
      const data = await response.json()
      setComments(data)
    } catch (e) {
      setCommentsError('Impossible de charger les commentaires')
    } finally {
      setLoadingComments(false)
    }
  }

  const handleLike = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post._id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors du like')
      }

      setIsLiked(!isLiked)
      setLikesCount((prev: number) => isLiked ? prev - 1 : prev + 1)
      if (onLike) onLike()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'À l\'instant'
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)}j`
    return date.toLocaleDateString()
  }

  const refreshComments = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post._id}/comments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Erreur lors du chargement des commentaires')
      const data = await response.json()
      setComments(data)
    } catch {}
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 mb-4 border border-gray-100 dark:border-gray-800 relative group">
      {isClickable && (
        <div ref={clickableRef} className="absolute inset-0 z-10 cursor-pointer rounded-2xl" style={{}} onClick={e => {
          if ((e.target as HTMLElement).closest('button, input, textarea, a')) return
          window.location.href = `/post/${post._id}`
        }} />
      )}
      <div className="flex gap-3 relative z-20">
        <Link href={`/profile/${post.author.username}`} onClick={e => e.stopPropagation()}>
          <Image
            src={post.author.profilePicture || '/default-avatar.png'}
            alt={post.author.name}
            width={40}
            height={40}
            className="rounded-full"
          />
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div>
              <Link href={`/profile/${post.author.username}`} className="font-bold text-gray-900 dark:text-gray-100 hover:underline" onClick={e => e.stopPropagation()}>
                {post.author.name}
              </Link>
              <span className="text-gray-500 dark:text-gray-400 ml-2">
                @{post.author.username}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">
                · {formatDate(post.createdAt)}
              </span>
            </div>
            <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" onClick={e => e.stopPropagation()}>
              <MdMoreHoriz className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-900 dark:text-gray-100 mb-3 whitespace-pre-wrap">
            {post.content}
          </p>
          <div className="flex items-center gap-6">
            <button
              onClick={e => { e.stopPropagation(); handleLike(); }}
              className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
            >
              {isLiked ? (
                <MdFavorite className="w-5 h-5 text-red-500" />
              ) : (
                <MdFavoriteBorder className="w-5 h-5" />
              )}
              <span>{likesCount}</span>
            </button>
            <button
              onClick={e => { e.stopPropagation(); window.location.href = `/post/${post._id}`; }}
              className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <MdChatBubbleOutline className="w-5 h-5" />
              <span>{comments.length}</span>
            </button>
            <button className="flex items-center gap-1 text-gray-500 hover:text-green-500 transition-colors" onClick={e => e.stopPropagation()}>
              <MdRepeat className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors" onClick={e => e.stopPropagation()}>
              <MdShare className="w-5 h-5" />
            </button>
          </div>
          {showCommentForm && (
            <div className="mt-4">
              <PostForm
                parentPostId={post._id}
                placeholder="Répondre..."
                onPostCreated={() => {
                  setShowCommentForm(false)
                  if (onComment) onComment()
                }}
              />
              <div className="mt-4">
                {loadingComments && <div className="text-gray-500">Chargement des commentaires...</div>}
                {commentsError && <div className="text-red-500">{commentsError}</div>}
                {!loadingComments && !commentsError && (
                  <FlatComments parentId={post._id} formatDate={formatDate} allComments={comments} replyingCommentId={replyingCommentId} setReplyingCommentId={setReplyingCommentId} onLike={refreshComments} />
                )}
                {(!loadingComments && !commentsError && comments.length === 0) && (
                  <div className="text-gray-500 text-sm">Aucun commentaire</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ThreadItem({ item, formatDate, repliesCount, onReply, replyingCommentId, setReplyingCommentId, children, onLike }: any) {
  const getUserId = () => localStorage.getItem('userId') || ''
  const isLikedByUser = (likes: any[]) => likes.some(like => (like._id || like) === getUserId())
  const isComment = !!item.parentPost
  const [isLiked, setIsLiked] = useState(isLikedByUser(item.likes || []))
  const [likesCount, setLikesCount] = useState(item.likes?.length || 0)
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${item._id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (onLike) onLike()
    } catch {}
  }
  useEffect(() => {
    setIsLiked(isLikedByUser(item.likes || []))
  }, [item.likes])
  return (
    <div className={isComment ? "flex gap-3 items-start mb-2" : "flex gap-3 items-start mb-4"}>
      <Image src={item.author?.username === 'daemon' ? '/me.jpg' : (item.author?.profilePicture || '/default-avatar.png')} alt={item.author?.name || ''} width={isComment ? 32 : 40} height={isComment ? 32 : 40} className={isComment ? "w-8 h-8 rounded-full object-cover" : "w-10 h-10 rounded-full object-cover"} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-gray-100">{item.author?.name}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">@{item.author?.username}</span>
          <span className="text-xs text-gray-400 ml-2">{formatDate(item.createdAt)}</span>
        </div>
        <div className="text-gray-800 dark:text-gray-200 whitespace-pre-line mt-1">{item.content}</div>
        <div className="flex items-center gap-4 mt-1 mb-2">
          <button className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors" onClick={handleLike}>
            {isLiked ? <MdFavorite className={isComment ? "w-4 h-4 text-red-500" : "w-5 h-5 text-red-500"} /> : <MdFavoriteBorder className={isComment ? "w-4 h-4" : "w-5 h-5"} />}
            <span>{likesCount}</span>
          </button>
          <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors" onClick={e => { e.stopPropagation(); window.location.href = `/post/${item._id}` }}>
            <MdChatBubbleOutline className={isComment ? "w-4 h-4" : "w-5 h-5"} />
            <span>{repliesCount}</span>
          </button>
          <button className="flex items-center gap-1 text-gray-500 hover:text-green-500 transition-colors" onClick={e => e.stopPropagation()}>
            <MdRepeat className={isComment ? "w-4 h-4" : "w-5 h-5"} />
          </button>
        </div>
        {replyingCommentId === item._id && (
          <div className="mb-2">
            <PostForm parentPostId={item._id} placeholder={`Répondre à @${item.author?.username}...`} onPostCreated={() => setReplyingCommentId(null)} />
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

function FlatComments({ parentId, formatDate, allComments, replyingCommentId, setReplyingCommentId, onLike }: { parentId: string | null, formatDate: (date: string) => string, allComments: any[], replyingCommentId: string | null, setReplyingCommentId: (id: string | null) => void, onLike?: () => void }) {
  const comments = allComments.filter(c => c.parentPost === parentId)
  if (!comments.length) return null
  return (
    <div>
      {comments.map(comment => {
        const repliesCount = allComments.filter(c => c.parentPost === comment._id).length
        return (
          <div key={comment._id} className="py-3 border-t border-gray-200 dark:border-gray-700 relative group">
            <div className="absolute inset-0 z-10 cursor-pointer rounded-xl" onClick={e => {
              if ((e.target as HTMLElement).closest('button, input, textarea, a')) return
              window.location.href = `/post/${comment._id}`
            }} />
            <ThreadItem
              item={comment}
              formatDate={formatDate}
              repliesCount={repliesCount}
              onReply={(e: React.MouseEvent) => { e.stopPropagation(); setReplyingCommentId(comment._id) }}
              replyingCommentId={replyingCommentId}
              setReplyingCommentId={setReplyingCommentId}
              onLike={onLike}
            />
          </div>
        )
      })}
    </div>
  )
}

export { ThreadItem, FlatComments } 