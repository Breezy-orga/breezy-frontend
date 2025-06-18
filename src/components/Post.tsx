'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { MdFavorite, MdFavoriteBorder, MdChatBubbleOutline, MdShare, MdMoreHoriz, MdRepeat } from 'react-icons/md'
import PostForm from './PostForm'
import PostHeader from './post/PostHeader'
import PostContent from './post/PostContent'
import PostActions from './post/PostActions'
import type { Post as PostType, User } from '@/types/models'


// Fonction simple pour lire un cookie côté client
function getCookie(name : string) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return decodeURIComponent(match[2]);
  return null;
}

interface PostProps {
  post: PostType
  currentUser: User
  onLike: (postId: string) => Promise<void>
  onComment: (postId: string, content: string) => Promise<void>
  onShare: (postId: string) => void
}

export default function Post({
  post,
  currentUser,
  onLike,
  onComment,
  onShare,
}: PostProps) {
  // Vérification et fallback complet pour le cas où l'author est null/undefined/string/objet
  // Typage explicite pour éviter l'erreur TypeScript
  if (!post.author) {
    console.error('Author is null or undefined for post:', post._id);
  }

  const authorObject = post.author && typeof post.author !== 'string' ? post.author as unknown as User : null;
  const authorId = typeof post.author === 'string' ? post.author : (authorObject?._id || '');
  const authorUsername = typeof post.author === 'string' ? 'Utilisateur' : (authorObject?.username || 'Inconnu');
  const authorProfilePicture = typeof post.author === 'string' ? '/default-avatar.png' : (authorObject?.profilePicture || '/default-avatar.png');
  const [showCommentForm, setShowCommentForm] = useState(false)
  const getUserId = () => getCookie('userId') || ''
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
    const response = await fetch(
      `/api/posts/${post._id}/comments`,
      {
        credentials: 'include', // <-- Ajouté
      }
    )
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
    const response = await fetch(
      `/api/posts/${post._id}/like`,
      {
        method: 'POST',
        credentials: 'include', // <-- Ajouté
      }
    )

    if (!response.ok) {
      throw new Error('Erreur lors du like')
    }

    setIsLiked(!isLiked)
    setLikesCount((prev: number) => (isLiked ? prev - 1 : prev + 1))
    if (onLike) onLike(post._id.toString())
  } catch (error) {
    console.error('Erreur:', error)
    alert('Une erreur est survenue')
  }
}

const refreshComments = async () => {
  try {
    const response = await fetch(
      `/api/posts/${post._id}/comments`,
      {
        credentials: 'include', // <-- Ajouté
      }
    )
    if (!response.ok) throw new Error('Erreur lors du chargement des commentaires')
    const data = await response.json()
    setComments(data)
  } catch {}
}

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden">
      <PostHeader
        author={post.author as unknown as User}
        createdAt={post.createdAt}
        location={post.location}
      />
      <PostContent post={post} />
      <PostActions
        post={post}
        currentUser={currentUser}
        onLike={handleLike}
        onComment={async (content) => {
          if (onComment) await onComment(post._id.toString(), content)
        }}
        onShare={() => {
          if (onShare) onShare(post._id.toString())
        }}
      />
    </article>
  )
}

function ThreadItem({ item, formatDate, repliesCount, onReply, replyingCommentId, setReplyingCommentId, children, onLike }: any) {
  const getUserId = () => getCookie('userId') || ''
  const isLikedByUser = (likes: any[]) => likes.some(like => (like._id || like) === getUserId())
  const isComment = !!item.parentPost
  const [isLiked, setIsLiked] = useState(isLikedByUser(item.likes || []))
  const [likesCount, setLikesCount] = useState(item.likes?.length || 0)
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`/api/posts/${item._id}/like`, {
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
      <Image src={item.author?.username === 'daemon' ? '/me.jpg' : (item.author?.profilePicture || '/default-avatar.png')} alt={item.author?.username || ''} width={isComment ? 32 : 40} height={isComment ? 32 : 40} className={isComment ? "w-8 h-8 rounded-full object-cover" : "w-10 h-10 rounded-full object-cover"} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-gray-100">{item.author?.username}</span>
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