'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import LikeButton from './LikeButton'
import { MdDelete, MdChatBubbleOutline, MdShare, MdRepeat } from 'react-icons/md';
import PostForm from './PostForm'
import PostHeader from './post/PostHeader'
import PostContent from './post/PostContent'
import MediaModal from './ImageModal'
import type { Post as PostType, User } from '@/types/models'

// Type étendu pour ajouter des propriétés temporaires
interface ExtendedPost extends PostType {
  commentsCount?: number;
}

const fetchUserId = async (): Promise<string | null> => {
  try {
    const res = await fetch('/api/users/me', {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Échec récupération userId');
    const data = await res.json();
    return data._id || null;
  } catch (err) {
    console.error('Erreur fetchUserId:', err);
    return null;
  }
}

interface PostProps {
  post: ExtendedPost
  currentUser: User | null
  onLike: (postId: string, updatedPost: PostType) => Promise<void>
  onComment: (postId: string, updatedPost: PostType) => Promise<void>
  onShare: (postId: string) => void
  onDelete?: (postId: string) => void
}

// Utilisateur par défaut en cas d'absence
const defaultUser: User = {
  _id: 'unknown',
  username: 'utilisateur',
  profilePicture: '/default-avatar.svg',
  role: 'user'
}

export default function Post({
  post: initialPost,
  currentUser,
  onLike,
  onComment,
  onShare,
  onDelete,
}: PostProps) {
  const safeCurrentUser = currentUser || defaultUser
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const [userId, setUserId] = useState<string | null>(null);
  const [post, setPost] = useState<ExtendedPost>(initialPost);

  if (!post.author) {
    console.error('Author is null or undefined for post:', post._id);
  }

  const authorObject = post.author && typeof post.author !== 'string' ? post.author as unknown as User : null;
  const authorId = typeof post.author === 'string' ? post.author : (authorObject?._id || '');
  const [showCommentForm, setShowCommentForm] = useState(false)
  const isLikedByUser = (likes: any[]) => likes.some(like => (like._id || like) === userId)
  const [isLiked, setIsLiked] = useState(isLikedByUser(post.likes))
  const [likesCount, setLikesCount] = useState(post.likes.length)
  const [comments, setComments] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0)
  const [expandedComments, setExpandedComments] = useState<Array<{ id: string, maxDisplayed: number }>>([])

  useEffect(() => { fetchUserId().then(setUserId); }, []);
  useEffect(() => { fetchComments() }, [])
  useEffect(() => { if (post.commentsCount !== undefined) setCommentsCount(post.commentsCount) }, [post.commentsCount])
  useEffect(() => { setIsLiked(isLikedByUser(post.likes)) }, [post.likes])

  const fetchComments = async () => {
    setLoadingComments(true)
    setCommentsError(null)
    try {
      const response = await fetch(`/api/posts/${post._id}/comments`, { credentials: 'include' })
      if (!response.ok) throw new Error('Erreur lors du chargement des commentaires')
      const data = await response.json()
      setComments(data)
    } catch (e) {
      setCommentsError('Impossible de charger les commentaires')
    } finally {
      setLoadingComments(false)
    }
  }

  const handleLike = (updatedPost: PostType) => {
    setPost(updatedPost);
    if (onLike) onLike(post._id.toString(), updatedPost);
  };

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
      setLoadingComments(true)
      setCommentsError(null)
      const response = await fetch(`/api/posts/${post._id}/comments`, { credentials: 'include' })
      if (!response.ok) throw new Error('Erreur lors du chargement des commentaires')
      const data = await response.json()
      setComments(data)
      if (data.length !== commentsCount) setCommentsCount(data.length)
    } catch (error) {
      setCommentsError('Erreur lors du rafraîchissement des commentaires')
      console.error('Erreur lors du rafraîchissement des commentaires:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleCommentClick = () => {
    window.location.href = `/post/${post._id}`
  }

  const handleCommentSubmit = async (postId: string, updatedPost: PostType) => {
    try {
      await onComment(postId, updatedPost)
      setShowCommentForm(false)
      setCommentsCount(prev => prev + 1)
      await refreshComments()
      setReplyingCommentId(null)
    } catch (error) {
      console.error('Erreur lors de la publication du commentaire:', error)
    }
  }

  // --- DARK MODE UPDATE ---
  return (
    <article className="bg-white dark:bg-[#141622] rounded-lg shadow-md overflow-hidden border border-gray-100 dark:border-gray-800 transition-colors duration-300">
      <PostHeader
        author={post.author as unknown as User || defaultUser}
        createdAt={new Date(post.createdAt)}
        location={post.location}
      />
      <PostContent post={post} />
      
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800 transition-colors">
        <div className="flex space-x-6">
          {/* Like */}
          <div className="flex items-center gap-1">
            <LikeButton 
              itemId={post._id.toString()} 
              itemType="post" 
              initialLikes={likesCount} 
              initialLikedStatus={post.likes.some((like:any) => (like._id || like) === userId)}
              onLikeSuccess={handleLike} 
            />
          </div>
          {/* Comment */}
          <button
            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            onClick={handleCommentClick}>
            <MdChatBubbleOutline className="w-5 h-5" />
            <span>{commentsCount}</span>
          </button>
          {/* Share */}
          <button 
            className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            onClick={() => onShare(post._id.toString())}
          >
            <MdShare className="w-5 h-5" />
          </button>
          {/* Delete */}
          {userId === authorId && (
            <button
              className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              onClick={() => onDelete && onDelete(post._id.toString())}
            >
              <MdDelete className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Commentaires si formulaire affiché */}
      {showCommentForm && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 transition-colors">
          <PostForm
            parentPostId={post._id}
            onPostCreated={() => {
              refreshComments()
              setCommentsCount(prev => prev + 1)
              commentInputRef.current?.blur()
            }}
          />
          <div className="mt-6">
            {loadingComments && <p className="text-center text-gray-500 dark:text-gray-400">Chargement des commentaires...</p>}
            {commentsError && <p className="text-center text-red-500 dark:text-red-400">{commentsError}</p>}
            {!loadingComments && !commentsError && comments.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">Aucun commentaire pour l'instant</p>
            ) : (
              <FlatComments 
                parentId={post._id} 
                formatDate={formatDate} 
                allComments={comments} 
                replyingCommentId={replyingCommentId}
                setReplyingCommentId={setReplyingCommentId}
                onLike={refreshComments}
                expandedComments={expandedComments}
                setExpandedComments={setExpandedComments}
                currentUser={safeCurrentUser}
              />
            )}
          </div>
        </div>
      )}
    </article>
  )
}


function ThreadItem({
  item,
  currentUser,
  formatDate,
  repliesCount,
  onReply,
  replyingCommentId,
  setReplyingCommentId,
  children,
  onLike,
  isCommentDisplay = true
}: any) {
  const [userId, setUserId] = useState<string | null>(null);
  const isLikedByUser = (likes: any[]) => likes.some(like => (like._id || like) === userId)
  const isComment = !!item.parentPost
  const [isLiked, setIsLiked] = useState(isLikedByUser(item.likes || []))
  const [likesCount, setLikesCount] = useState(item.likes?.length || 0)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSrc, setModalSrc] = useState<string>('');
  const [modalAlt, setModalAlt] = useState<string>('');
  const [modalType, setModalType] = useState<'image' | 'video'>('image');
  
  useEffect(() => { fetchUserId().then(setUserId); }, []);
  useEffect(() => { setIsLiked(isLikedByUser(item.likes || [])) }, [item.likes])

  const handleLike = (updatedPost: PostType) => {
    setIsLiked(
      updatedPost.likes.some((like: any) =>
        (typeof like === 'object' ? like._id : like) === userId
      )
    );
    setLikesCount(updatedPost.likes.length);
    if (onLike) onLike(item._id.toString(), updatedPost);
  };

  const openMediaModal = (src: string, alt: string = '', type: 'image' | 'video' = 'image') => {
    setModalSrc(src);
    setModalAlt(alt);
    setModalType(type);
    setModalOpen(true);
  };

  const getMediaSrc = (media: any, index: number): string => {
    if (media.base64) {
      return `data:${media.contentType || 'image/jpeg'};base64,${media.base64}`;
    }
    if (media.url && (media.url.startsWith('http://') || media.url.startsWith('https://'))) {
      return media.url;
    }
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    return `${apiBaseUrl}/media/post/${item._id}/media/${index}?format=raw`;
  };
  const medias = Array.isArray(item.media)
  ? item.media
  : item.media
    ? [item.media]
    : [];

  return (
    <div className={
      isComment
        ? "flex gap-3 items-start mb-2"
        : "flex gap-3 items-start mb-4"
    }>
      <Image 
        src={item.author?.profilePicture || '/default-avatar.svg'} 
        alt={`Photo de profil de ${item.author?.username || 'utilisateur'}`} 
        width={isComment ? 32 : 40} 
        height={isComment ? 32 : 40} 
        className={isComment ? "w-8 h-8 rounded-full object-cover" : "w-10 h-10 rounded-full object-cover"} 
      />
      <div className="flex-1">
        {/* Infos auteur */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-gray-100">{item.author?.username || 'utilisateur'}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">@{item.author?.username || 'utilisateur'}</span>
          <span className="text-xs text-gray-400 ml-2 dark:text-gray-500">{formatDate(item.createdAt)}</span>
        </div>
        {/* Contenu du post/commentaire */}
        <div className="text-gray-800 dark:text-gray-100 whitespace-pre-line mt-1">{item.content}</div>
        
        {/* Affichage médias */}

        {medias.length > 0 && (
          <div className={`mt-2 grid ${medias.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
            {medias.slice(0, 4).map((media: any, index: number)  => {
              const imageSrc = getMediaSrc(media, index);
              return (
                <div 
                  key={index} 
                  className="relative aspect-square cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    const type = media.contentType?.startsWith('video/') ? 'video' : 'image';
                    openMediaModal(imageSrc, media.alt || `Media ${index + 1}`, type);
                  }}
                >
                  {media.contentType?.startsWith('video/') ? (
                    <div className="relative w-full h-full rounded-lg overflow-hidden">
                      <div className="w-full h-full relative">
                        <video
                          src={imageSrc}
                          className="absolute inset-0 w-full h-full object-cover"
                          muted
                          playsInline
                          onLoadedMetadata={(e) => {
                            const video = e.currentTarget;
                            setTimeout(() => {
                              try {
                                video.currentTime = Math.min(1, video.duration / 4);
                              } catch (err) {}
                            }, 50);
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-20 hover:bg-opacity-10 transition-all flex items-center justify-center">
                          <span className="flex items-center gap-1 text-white text-sm font-medium bg-black bg-opacity-60 hover:bg-opacity-80 px-2 py-1 rounded-md transition-all">
                            <span className="text-sm">▶️</span> Vidéo
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={imageSrc}
                      alt={media.alt || `Media ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                    />
                  )}
                  {index === 3 && medias.length > 4 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      +{medias.length - 4}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        
        {/* Actions */}
        <div className="flex items-center gap-4 mt-1 mb-2">
          {/* Like */}
          <LikeButton 
            itemId={item._id.toString()}
            parentId={item.parentPost}
            itemType={isComment ? 'comment' : 'post'} 
            initialLikes={likesCount} 
            initialLikedStatus={isLiked}
            onLikeSuccess={handleLike} 
            size={isComment ? "small" : "normal"}
          />
          {/* Commenter */}
          <button 
            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
            onClick={(e) => { 
              e.preventDefault();
              e.stopPropagation(); 
              if (onReply) onReply(e); 
            }}
            aria-label="Commenter"
            title="Commenter"
          >
            <MdChatBubbleOutline className={isComment ? "w-4 h-4" : "w-5 h-5"} />
            <span>{repliesCount || 0}</span>
          </button>
          {/* Republier */}
          <button 
            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors duration-200"
            aria-label="Republier"
            title="Republier"
            onClick={(e) => {
              e.preventDefault(); 
              e.stopPropagation();
              alert('Fonctionnalité de republication à venir !'); 
            }}
          >
            <MdRepeat className={isComment ? "w-4 h-4" : "w-5 h-5"} />
          </button>
        </div>
        
        {/* Formulaire réponse si sélectionné */}
        {replyingCommentId === item._id && (
          <div className="border-t border-gray-200 dark:border-gray-800 mt-2 pt-2">
            <PostForm
              parentPostId={item._id}
              placeholder={`Répondre à @${item.author?.username || 'utilisateur'}...`}
              onPostCreated={() => {
                setReplyingCommentId(null);
                if (onLike) onLike();
              }}
            />
          </div>
        )}
        
        {children}
      </div>
      {/* Media modal */}
      <MediaModal
        isOpen={modalOpen}
        src={modalSrc}
        alt={modalAlt}
        mediaType={modalType}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}

function FlatComments({
  parentId, currentUser, formatDate, allComments, replyingCommentId,
  setReplyingCommentId, onLike, expandedComments, setExpandedComments
}: {
  parentId: string | null,
  formatDate: (date: string) => string,
  allComments: any[],
  replyingCommentId: string | null,
  setReplyingCommentId: (id: string | null) => void,
  onLike?: () => void,
  expandedComments: Array<{ id: string, maxDisplayed: number }>,
  setExpandedComments: React.Dispatch<React.SetStateAction<Array<{ id: string, maxDisplayed: number }>>>
  currentUser: User
}) {
  const maxDisplayedComments = 3;
  const comments = allComments.filter(c => c.parentPost === parentId)
  if (!comments.length) return null

  return (
    <div className="space-y-3">
      {comments.map(comment => {
        const childComments = allComments.filter(c => c.parentPost === comment._id)
        const repliesCount = childComments.length
        return (
          <ThreadItem
            key={comment._id}
            item={comment}
            currentUser={currentUser}
            formatDate={formatDate}
            repliesCount={repliesCount}
            onReply={(e: React.MouseEvent) => { 
              e.stopPropagation(); 
              setReplyingCommentId(comment._id);
            }}
            replyingCommentId={replyingCommentId}
            setReplyingCommentId={setReplyingCommentId}
            onLike={onLike}
            isComment={true}
          >
            {repliesCount > 0 && (
              <div className="ml-8 mt-2 border-l-2 border-gray-200 dark:border-gray-800 pl-4 space-y-3">
                {childComments.slice(0, expandedComments?.find(item => item.id === comment._id)?.maxDisplayed || maxDisplayedComments).map(reply => (
                  <ThreadItem
                    key={reply._id}
                    item={reply}
                    formatDate={formatDate}
                    repliesCount={allComments.filter(c => c.parentPost === reply._id).length}
                    onReply={(e: React.MouseEvent) => { 
                      e.stopPropagation(); 
                      setReplyingCommentId(reply._id);
                    }}
                    replyingCommentId={replyingCommentId}
                    setReplyingCommentId={setReplyingCommentId}
                    onLike={onLike}
                    isComment={true}
                  />
                ))}
                {repliesCount > maxDisplayedComments && 
                  (!expandedComments.some(item => item.id === comment._id) || 
                    (expandedComments.find(item => item.id === comment._id)?.maxDisplayed ?? 0) < repliesCount) && (
                  <button 
                    className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-sm font-medium mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const commentIndex = expandedComments.findIndex(item => item.id === comment._id);
                      if (commentIndex !== -1) {
                        const newExpandedComments = [...expandedComments];
                        newExpandedComments[commentIndex] = { ...newExpandedComments[commentIndex], maxDisplayed: repliesCount };
                        setExpandedComments(newExpandedComments);
                      } else {
                        const newExpandedComments = [...expandedComments, { id: comment._id, maxDisplayed: repliesCount }];
                        setExpandedComments(newExpandedComments);
                      }
                    }}
                  >
                    Afficher plus de commentaires ({repliesCount - maxDisplayedComments})
                  </button>
                )}
              </div>
            )}
          </ThreadItem>
        )
      })}
    </div>
  )
}


export { ThreadItem, FlatComments }
