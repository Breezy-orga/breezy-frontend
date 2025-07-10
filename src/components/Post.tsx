'use client'

import * as React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import LikeButton from './LikeButton'
import { MdDelete, MdChatBubbleOutline, MdShare, MdRepeat } from 'react-icons/md';
import PostForm from './PostForm'
import PostHeader from './post/PostHeader'
import PostContent from './PostContent'
import MediaModal from './ImageModal'
import type { Post as PostType, User } from '@/types/models'
import { useTranslation } from 'react-i18next';
import { formatRelativeDate } from '../i18n/formatRelativeDate';


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
  onLike?: (itemId: string, update: { liked: boolean; totalLikes: number }) => void;
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

export interface Media {
  base64?: string
  contentType?: string
  url?: string
  type?: 'image' | 'video'
  alt?: string
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
  const { t, i18n } = useTranslation();
  // Ajout d'un state pour forcer le re-render sur changement de langue
  const [forceRerender, setForceRerender] = useState(0);
  useEffect(() => {
    const handleLangChange = () => setForceRerender((f: number) => f + 1);
    i18n.on('languageChanged', handleLangChange);
    return () => {
      i18n.off('languageChanged', handleLangChange);
    };
  }, [i18n]);

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

  const handleLike = (update: { liked: boolean; totalLikes: number }) => {
    setIsLiked(update.liked);
    setLikesCount(update.totalLikes);
    onLike?.(post._id.toString(), update);
  };

  // Utilitaire pour lire la langue depuis le localStorage ou le cookie i18next
  function getLangFromStorageOrCookie() {
    if (typeof window !== 'undefined') {
      const lsLang = window.localStorage.getItem('i18nextLng');
      if (lsLang) return lsLang;
    }
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )i18next=([^;]*)/);
      if (match) return decodeURIComponent(match[1]);
    }
    return null;
  }

  // Formatage date relative, utilise l'utilitaire partagé
  const formatDate = useCallback((dateString: string) => formatRelativeDate(dateString, t), [t, i18n.resolvedLanguage, forceRerender]);

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
      setCommentsCount((prev: number) => prev + 1)
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
      <PostContent
        content={post.content}
        media={post.media}
        className="px-4 py-2"
      />

      
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800 transition-colors">
        <div className="flex space-x-6">
          {/* Like */}
          <div className="flex items-center gap-1 text-red-500 dark:text-red-500 fill-current">
            <LikeButton
              itemId={post._id.toString()}
              itemType="post"
              size="normal" 
              initialLikes={likesCount}
              initialLikedStatus={isLiked}
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
              setCommentsCount((prev: number) => prev + 1)
              commentInputRef.current?.blur()
            }}
          />
          <div className="mt-6">
            {loadingComments && <p className="text-center text-gray-500 dark:text-gray-400">{t('post.loading')}</p>}
            {commentsError && <p className="text-center text-red-500 dark:text-red-400">{t('post.error', { error: commentsError })}</p>}
            {!loadingComments && !commentsError && comments.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">{t('post.no_comments', "No comments yet")}</p>
            ) : (
              <FlatComments 
                parentId={post._id} 
                formatDate={formatDate} 
                allComments={comments} 
                replyingCommentId={replyingCommentId}
                setReplyingCommentId={setReplyingCommentId}
                onLike={refreshComments}
                onCommentCreated={refreshComments}
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

const getMediaSrc = (media: Media): string => {
  if (media.url) return media.url
  if (media.base64 && media.contentType) {
    return `data:${media.contentType};base64,${media.base64}`
  }
  if ((media as any).data) return (media as any).data
  return ''
}

const getMediaType = (media: Media): 'image' | 'video' => {
  if (media.type) return media.type
  if (media.contentType) {
    return media.contentType.startsWith('video/') ? 'video' : 'image'
  }
  if (media.url) {
    const ext = media.url.split('.').pop()?.toLowerCase()
    if (ext && ['mp4','webm','ogg','mov','avi'].includes(ext)) {
      return 'video'
    }
  }
  return 'image'
}


function ThreadItem({
  item,
  currentUser,
  formatDate,
  repliesCount,
  onReply,
  replyingCommentId,
  setReplyingCommentId,
  onLike,
  onCommentCreated,
  isClickable = true,
  isComment = false
}: {
  item: any,
  currentUser: User,
  formatDate: (date: string) => string,
  repliesCount: number,
  onReply: (e: React.MouseEvent<HTMLButtonElement>) => void,
  replyingCommentId: string | null,
  setReplyingCommentId: (id: string | null) => void,
  onLike?: (itemId: string, liked: boolean, totalLikes: number) => void,
  onCommentCreated?: () => void,
  isClickable?: boolean,
  isComment?: boolean
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [likesCount, setLikesCount] = useState(item.likes.length)
  const [isLiked, setIsLiked] = useState(
    item.likes.some((l: any) => (l._id || l) === currentUser._id)
  )

  const [modalOpen, setModalOpen] = useState(false);
  const [modalSrc, setModalSrc] = useState<string>('');
  const [modalAlt, setModalAlt] = useState<string>('');
  const [modalType, setModalType] = useState<'image' | 'video'>('image');
  const { t } = useTranslation();
  
  //useEffect(() => { fetchUserId().then(setUserId); }, []);
  //useEffect(() => { setIsLiked(isLikedByUser(item.likes || [])) }, [item.likes])

  useEffect(() => {
    const liked = item.likes.some((l: any) => (l._id || l) === currentUser._id);
    setIsLiked(liked);
    setLikesCount(item.likes.length);
  }, [item.likes, currentUser._id]);

  useEffect(() => {
    fetchUserId().then(setUserId);
  }, []);

  const handleLikeSuccess = (update: { liked: boolean; totalLikes: number }) => {
    onLike?.(item._id.toString(), update.liked, update.totalLikes);
    setIsLiked(update.liked);
    setLikesCount(update.totalLikes);
  }

  const openMediaModal = (src: string, alt = '', type: 'image' | 'video' = 'image') => {
    setModalSrc(src);
    setModalAlt(alt);
    setModalType(type);
    setModalOpen(true);
  };

  const getMediaSrc = (m: any) =>
    m.url || (m.base64 ? `data:${m.contentType};base64,${m.base64}` : '');

  const getMediaType = (m: any) =>
    m.contentType?.startsWith('video/') ? 'video' : 'image';

  const media = Array.isArray(item.media) ? item.media : item.media ? [item.media] : [];

  const handleClick = () => {
    if (isClickable && !isComment) {
      window.location.href = `/post/${item._id}`;
    }
  };

  return (
    <div
      className={`p-4 bg-white dark:bg-[#151925] rounded-xl shadow-md transition-colors ${
        isComment ? 'mb-2' : 'mb-4'
      } ${isClickable && !isComment ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1f2e]' : ''}`}
      onClick={handleClick}
    >
      {/* En-tête avec avatar et infos utilisateur */}
      <div className="flex gap-3 mb-3">
        <Image
          src={item.author?.profilePicture || '/default-avatar.svg'}
          alt={`Avatar de ${item.author?.username || 'utilisateur'}`}
          width={isComment ? 32 : 40}
          height={isComment ? 32 : 40}
          className={`${isComment ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover`}
        />
        <div className="flex flex-col justify-center">
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {item.author?.username || 'utilisateur'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(item.createdAt)}
          </span>
        </div>
      </div>

      {/* Contenu texte */}
      <div className="mb-3 whitespace-pre-wrap text-gray-900 dark:text-gray-100">
        {item.content}
      </div>

      {/* Médias */}
      {media.length > 0 && (
        <div
          className={`mb-3 grid gap-2 ${
            media.length === 1
              ? 'grid-cols-1'
              : media.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-2 grid-rows-2'
          }`}
        >
          {media.slice(0, 4).map((m: any, idx: number) => {
            const src = getMediaSrc(m);
            const type = getMediaType(m);
            if (!src) return null;

            return (
              <div
                key={idx}
                className="relative w-full aspect-square rounded-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {type === 'image' ? (
                  <Image
                    src={src}
                    alt={m.alt || ''}
                    fill
                    className="object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openMediaModal(src, m.alt || '', 'image')}
                  />
                ) : (
                  <video
                    src={src}
                    controls
                    className="w-full h-full object-cover rounded-lg"
                  />
                )}
                {idx === 3 && media.length > 4 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xl font-semibold">
                    +{media.length - 4}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
        {/* Like */}
        <div onClick={(e) => e.stopPropagation()}>
          <LikeButton
            itemId={item._id.toString()}
            itemType={isComment ? 'comment' : 'post'}
            parentId={isComment ? item.parentPost?.toString() : undefined}
            size={isComment ? 'small' : 'normal'}
            initialLikes={likesCount}
            initialLikedStatus={isLiked}
            onLikeSuccess={handleLikeSuccess}
          />
        </div>

        {/* Commentaire/Réponse */}
        <button
          className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setReplyingCommentId(item._id);
          }}
        >
          <MdChatBubbleOutline className="w-4 h-4" />
          <span className="text-sm">{repliesCount}</span>
        </button>

        {/* Partage */}
        <button
          className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            // Logique de partage
            navigator.clipboard.writeText(window.location.origin + `/post/${item._id}`)
              .then(() => alert('Lien copié !'))
              .catch(() => alert('Erreur lors de la copie'));
          }}
        >
          <MdShare className="w-4 h-4" />
        </button>

        {/* Supprimer (si propriétaire) */}
        {userId === (typeof item.author === 'string' ? item.author : item.author?._id) && (
          <button
            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Êtes-vous sûr de vouloir supprimer ce contenu ?')) {
                console.log('Suppression de:', item._id);
              }
            }}
          >
            <MdDelete className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Formulaire de réponse */}
      {replyingCommentId === item._id && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <PostForm
            parentPostId={item._id}
            placeholder={`Répondre à @${item.author?.username || 'utilisateur'}...`}
            onPostCreated={() => {
              setReplyingCommentId(null);
              onCommentCreated?.();
            }}
          />
        </div>
      )}

      {/* Modal média */}
      <MediaModal
        isOpen={modalOpen}
        src={modalSrc}
        alt={modalAlt}
        mediaType={modalType}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}


function FlatComments({
  parentId,
  currentUser,
  formatDate,
  allComments,
  replyingCommentId,
  setReplyingCommentId,
  onLike,
  onCommentCreated,
  expandedComments,
  setExpandedComments
}: {
  parentId: string | null,
  formatDate: (date: string) => string,
  allComments: any[],
  replyingCommentId: string | null,
  setReplyingCommentId: (id: string | null) => void,
  onLike?: (commentId: string, liked: boolean, totalLikes: number) => void,
  onCommentCreated?: () => void,
  expandedComments: Array<{ id: string, maxDisplayed: number }>,
  setExpandedComments: React.Dispatch<any>,
  currentUser: User
}): React.ReactNode {
  const { t } = useTranslation();
  const maxDisplayedComments = 3

  const levelComments = allComments.filter(c => c.parentPost === parentId)
  
  if (levelComments.length === 0) return null

  const countAllReplies = (commentId: string): number => {
    const directReplies = allComments.filter(c => c.parentPost === commentId)
    return directReplies.reduce((total, reply) => {
      return total + 1 + countAllReplies(reply._id)
    }, 0)
  }

  const getAllReplies = (commentId: string): any[] => {
    const directReplies = allComments.filter(c => c.parentPost === commentId)
    const nestedReplies = directReplies.flatMap(reply => getAllReplies(reply._id))
    return [...directReplies, ...nestedReplies]
  }

  return (
    <div className="space-y-3">
      {levelComments.map(comment => {
        const directReplies = allComments.filter(c => c.parentPost === comment._id)
        const totalRepliesCount = countAllReplies(comment._id)
        
        const isExpanded = expandedComments.some(x => x.id === comment._id)
        
        const toggleReplies = (e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation()
          if (isExpanded) {
            setExpandedComments((prev: { id: string; maxDisplayed: number }[]) => 
              prev.filter(x => x.id !== comment._id)
            )
          } else {
            setExpandedComments((prev: { id: string; maxDisplayed: number }[]) => [
              ...prev, 
              { id: comment._id, maxDisplayed: totalRepliesCount }
            ])
          }
        }

        return (
          <div key={comment._id} className="space-y-2">
            {/* Commentaire principal */}
            <ThreadItem
              item={comment}
              currentUser={currentUser}
              formatDate={formatDate}
              repliesCount={totalRepliesCount}
              onReply={(e: React.MouseEvent<HTMLButtonElement>) => { 
                e.stopPropagation(); 
                setReplyingCommentId(comment._id) 
              }}
              replyingCommentId={replyingCommentId}
              setReplyingCommentId={setReplyingCommentId}
              onLike={onLike}
              onCommentCreated={onCommentCreated}
              isComment={true}
            />

            {/* Bouton pour afficher/masquer les réponses */}
            {totalRepliesCount > 0 && (
              <div className="ml-12">
                <button
                  className="text-sm text-blue-500 dark:text-blue-400 hover:underline flex items-center gap-1"
                  onClick={toggleReplies}
                >
                  {isExpanded ? (
                    <>
                      <span>−</span>
                      <span>Masquer les réponses</span>
                    </>
                  ) : (
                    <>
                      <span>+</span>
                      <span>{t('post.show_more_comments', { count: totalRepliesCount - maxDisplayedComments })}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Sous-commentaires (affichés seulement si étendu) */}
            {isExpanded && totalRepliesCount > 0 && (
              <div className="ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-4 space-y-3">
                <FlatComments
                  parentId={comment._id}
                  currentUser={currentUser}
                  formatDate={formatDate}
                  allComments={allComments}
                  replyingCommentId={replyingCommentId}
                  setReplyingCommentId={setReplyingCommentId}
                  onLike={onLike}
                  onCommentCreated={onCommentCreated}
                  expandedComments={expandedComments}
                  setExpandedComments={setExpandedComments}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}


export { ThreadItem, FlatComments }
