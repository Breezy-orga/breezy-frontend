'use client'

import * as React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import LikeButton from './LikeButton'
import { MdDelete, MdChatBubbleOutline, MdShare, MdRepeat, MdFlag } from 'react-icons/md';
import PostForm from './PostForm'
import PostHeader from './post/PostHeader'
import PostContent from './PostContent'
import MediaModal from './ImageModal'
import type { Post as PostType, User } from '@/types/models'
import { useTranslation } from 'react-i18next';
import { formatRelativeDate } from '../i18n/formatRelativeDate';
import ReportModal from './ReportModal'

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
  onProfileClick?: (userId: string, username?: string) => void // Nouvelle prop
}

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
  onProfileClick, // Nouvelle prop
}: PostProps) {
  const safeCurrentUser = currentUser || defaultUser
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const [userId, setUserId] = useState<string | null>(null);
  const [post, setPost] = useState<ExtendedPost>(initialPost);
  const { t, i18n } = useTranslation();
  const [forceRerender, setForceRerender] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Détection si on est sur la page du post
  const [isOnPostPage, setIsOnPostPage] = useState(false);
  
  useEffect(() => {
    // Vérifier si on est sur la page individuelle du post
    setIsOnPostPage(window.location.pathname.includes(`/post/${post._id}`));
  }, [post._id]);
  
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
  
  // Fonction améliorée pour vérifier si l'utilisateur a liké avec logs détaillés
  const isLikedByUser = useCallback((likes: any[], currentUserId: string | null) => {
    if (!currentUserId || !likes || likes.length === 0) {
      console.log('isLikedByUser: false (pas d\'utilisateur ou pas de likes)', {
        currentUserId,
        likes,
        hasUser: !!currentUserId,
        hasLikes: !!(likes && likes.length > 0)
      });
      return false;
    }
    
    const userHasLiked = likes.some(like => {
      // Gestion des différents formats de données
      if (typeof like === 'string') {
        return like === currentUserId;
      }
      if (like && typeof like === 'object') {
        return like._id === currentUserId || like.toString() === currentUserId;
      }
      return false;
    });
    
    console.log('isLikedByUser: résultat', {
      currentUserId,
      likes,
      userHasLiked,
      likesDetails: likes.map(like => ({
        value: like,
        type: typeof like,
        matches: typeof like === 'string' ? like === currentUserId : 
                 (like && typeof like === 'object') ? (like._id === currentUserId || like.toString() === currentUserId) : false
      }))
    });
    
    return userHasLiked;
  }, []);

  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes.length)
  const [comments, setComments] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0)
  const [expandedComments, setExpandedComments] = useState<Array<{ id: string, maxDisplayed: number }>>([])

  useEffect(() => { 
    fetchUserId().then(setUserId); 
  }, []);
  
  useEffect(() => { 
    fetchComments() 
  }, [])
  
  useEffect(() => { 
    if (post.commentsCount !== undefined) setCommentsCount(post.commentsCount) 
  }, [post.commentsCount])
  
  useEffect(() => {
  const liked = isLikedByUser(post.likes, safeCurrentUser._id);
  setIsLiked(liked);
  setLikesCount(post.likes.length);
  }, [post.likes, safeCurrentUser._id, isLikedByUser]);

  // Synchroniser avec les props quand le post change
  useEffect(() => {
    console.log('Synchronisation post:', {
      initialPost: initialPost._id,
      likes: initialPost.likes.length,
      newLikes: initialPost.likes
    });
    setPost(initialPost);
    
    // Recalculer l'état des likes quand le post change
    const liked = isLikedByUser(initialPost.likes, safeCurrentUser._id);
    setIsLiked(liked);
    setLikesCount(initialPost.likes.length);
  }, [initialPost, isLikedByUser, safeCurrentUser._id]);

  // Fonction pour transformer le contenu avec mentions cliquables
  const renderContentWithMentions = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.substring(1);
        return (
          <Link
            key={index}
            href={`/profile/username/${username}`}
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
          >
            {part}
          </Link>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

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
    console.log('handleLike appelé:', update);
    
    setIsLiked(update.liked);
    setLikesCount(update.totalLikes);
    
    onLike?.(post._id.toString(), update);
  };

  const formatDate = useCallback((dateString: string) => formatRelativeDate(dateString, t), [t, i18n.resolvedLanguage, forceRerender]);

  const refreshComments = async () => {
    try {
      setLoadingComments(true)
      setCommentsError(null)
      const response = await fetch(`/api/posts/${post._id}/comments`, { credentials: 'include' })
      if (!response.ok) throw new Error('Erreur lors du chargement des commentaires')
      const data = await response.json()
      setComments(data)
      setCommentsCount(data.length)
    } catch (error) {
      setCommentsError('Erreur lors du rafraîchissement des commentaires')
      console.error('Erreur lors du rafraîchissement des commentaires:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleCommentClick = () => {
    if (isOnPostPage) {
      setShowCommentForm(!showCommentForm);
    } else {
      window.location.href = `/post/${post._id}`;
    }
  }

  // Fonction pour gérer le clic sur le post
  const handlePostClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('a') || 
      target.closest('textarea') ||
      target.closest('input') ||
      target.closest('[contenteditable]') ||
      isOnPostPage
    ) {
      return;
    }

    window.location.href = `/post/${post._id}`;
  };

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

  // Fonction pour supprimer le post
  const handleDelete = async (postId: string) => {
    if (isDeleting) {
      console.log('Suppression déjà en cours, appel ignoré');
      return;
    }

    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('Post supprimé avec succès côté serveur');
        
        if (isOnPostPage) {
          console.log('Redirection vers l\'accueil...');
          window.location.href = '/';
          return;
        }

        if (onDelete) {
          console.log('Appel de onDelete pour mise à jour de la liste');
          onDelete(postId);
        } else {
          console.warn('onDelete callback non fourni');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Erreur lors de la suppression';
        console.error('Erreur serveur lors de la suppression:', errorMessage);
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Erreur réseau lors de la suppression:', error);
      setIsDeleting(false);
    }
  };

  // Fonction pour supprimer un commentaire
  const handleCommentDelete = async (commentId: string) => {
    if (commentId === post._id) {
      console.warn('Tentative de suppression du post principal via handleCommentDelete - ignorée');
      return;
    }

    try {
      const response = await fetch(`/api/posts/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setComments(prevComments => 
          prevComments.filter(comment => comment._id !== commentId)
        );
        setCommentsCount(prev => Math.max(0, prev - 1));
        console.log('Commentaire supprimé:', commentId);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur lors de la suppression du commentaire:', errorData.message);
      }
    } catch (error) {
      console.error('Erreur suppression commentaire:', error);
    }
  };

  if (isDeleting) {
    return (
      <article className="bg-white dark:bg-[#141622] rounded-lg shadow-md overflow-hidden border border-gray-100 dark:border-gray-800 transition-colors duration-300 opacity-50">
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto mb-2"></div>
          <span className="text-gray-500 dark:text-gray-400">{t('post.deleting') || 'Suppression en cours...'}</span>
        </div>
      </article>
    );
  }

  return (
    <article 
      className={`bg-white dark:bg-[#141622] rounded-lg shadow-md overflow-hidden border border-gray-100 dark:border-gray-800 transition-colors duration-300 ${
        !isOnPostPage ? 'cursor-pointer hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-700' : ''
      }`}
      onClick={handlePostClick}
    >
      <PostHeader
        author={post.author as unknown as User || defaultUser}
        createdAt={new Date(post.createdAt)}
        location={post.location}
      />
      
      {/* Contenu avec mentions et médias */}
      <div className="px-4 py-2">
        {post.content && (
          <div className="mb-3 whitespace-pre-wrap text-gray-900 dark:text-gray-100">
            {renderContentWithMentions(post.content)}
          </div>
        )}
        <PostContent
          content=""
          media={post.media}
          tags={post.tags}
        />
      </div>

      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800 transition-colors">
        <div className="flex space-x-6">
          <div 
            className="flex items-center gap-1 text-red-500 dark:text-red-500 fill-current"
            onClick={(e) => e.stopPropagation()} 
          >
            <LikeButton
              itemId={post._id.toString()}
              itemType="post"
              size="normal" 
              initialLikes={post.likes.length}
              initialLikedStatus={isLikedByUser(post.likes, safeCurrentUser._id)}
              onLikeSuccess={handleLike}
            />
          </div>
          <button
            className={`flex items-center gap-1 transition-colors ${
              showCommentForm 
                ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg' 
                : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'
            }`}
            onClick={(e) => {
              e.stopPropagation(); 
              handleCommentClick();
            }}>
            <MdChatBubbleOutline className={`w-5 h-5 transition-transform ${
              showCommentForm ? 'scale-110' : ''
            }`} />
            <span>{commentsCount}</span>
          </button>
          <button 
            className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            onClick={(e) => {
              e.stopPropagation(); 
              onShare(post._id.toString());
            }}
          >
            <MdShare className="w-5 h-5" />
          </button>
          
          {/* Bouton de signalement */}
          <button 
            className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            onClick={(e) => {
              e.stopPropagation(); 
              setShowReportModal(true);
            }}
            title={t('report.report_post', 'Signaler ce post')}
          >
            <MdFlag className="w-5 h-5" />
          </button>
          
          {userId === authorId && (
            <button
              className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              onClick={(e) => {
                e.stopPropagation(); 
                if (!isDeleting) {
                  handleDelete(post._id.toString());
                }
              }}
              disabled={isDeleting}
            >
              <MdDelete className="w-5 h-5" />
              {isDeleting && <span className="text-xs">...</span>}
            </button>
          )}
        </div>
      </div>

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
                onProfileClick={onProfileClick} // Passer la prop
                onDelete={(commentId) => {
                  if (commentId === post._id) {
                    console.warn('Tentative de suppression du post principal via commentaire - ignorée');
                    return;
                  }
                  setComments(prevComments => 
                    prevComments.filter(comment => comment._id !== commentId)
                  );
                  setCommentsCount(prev => Math.max(0, prev - 1));
                  handleCommentDelete(commentId);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Modal de signalement */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        postId={post._id}
      />
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
  onLike,
  onCommentCreated,
  isClickable = true,
  isComment = false,
  onDelete,
  deletingCommentId,
  onProfileClick // Nouvelle prop
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
  isComment?: boolean,
  onDelete?: (commentId: string) => void,
  deletingCommentId?: string | null,
  onProfileClick?: (userId: string, username?: string) => void // Nouvelle prop
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [likesCount, setLikesCount] = useState(item.likes.length)
  const [isDeleting, setIsDeleting] = useState(false);

  // État pour le modal de signalement dans ThreadItem
  const [showReportModal, setShowReportModal] = useState(false);

  const isLikedByUser = useCallback((likes: any[], currentUserId: string | null) => {
    if (!currentUserId || !likes || likes.length === 0) return false;
    
    return likes.some(like => {
      if (typeof like === 'string') {
        return like === currentUserId;
      }
      if (like && typeof like === 'object') {
        return like._id === currentUserId || like.toString() === currentUserId;
      }
      return false;
    });
  }, []);

  const [isLiked, setIsLiked] = useState(false)

  const [modalOpen, setModalOpen] = useState(false);
  const [modalSrc, setModalSrc] = useState<string>('');
  const [modalAlt, setModalAlt] = useState<string>('');
  const [modalType, setModalType] = useState<'image' | 'video'>('image');
  const { t } = useTranslation();

  // Fonction pour supprimer un commentaire
  const handleDeleteComment = async (commentId: string) => {
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/posts/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        onDelete?.(commentId);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur lors de la suppression du commentaire:', errorData.message);
      }
    } catch (error) {
      console.error('Erreur suppression commentaire:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Fonction pour transformer le contenu avec mentions cliquables dans ThreadItem
  const renderContentWithMentions = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.substring(1);
        return (
          <Link
            key={index}
            href={`/profile/username/${username}`}
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };
  
  useEffect(() => {
    const liked = isLikedByUser(item.likes, currentUser._id);
    setIsLiked(liked);
    setLikesCount(item.likes.length);
  }, [item.likes, currentUser._id, isLikedByUser]);

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

  if (isDeleting) {
    return (
      <div className={`p-4 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-md transition-colors ${
        isComment ? 'mb-2' : 'mb-4'
      } opacity-50`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mx-auto mb-2"></div>
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {t('post.deleting_comment') || 'Suppression en cours...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 bg-white dark:bg-[#151925] rounded-xl shadow-md transition-colors ${
        isComment ? 'mb-2' : 'mb-4'
      } ${isClickable && !isComment ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1f2e]' : ''}`}
      onClick={handleClick}
    >
      <div className="flex gap-3 mb-3">
        {/* Avatar cliquable avec Link */}
        <Link href={`/profile/${typeof item.author === 'string' ? item.author : item.author?._id}`}>
          <div className="hover:opacity-80 transition-opacity">
            <Image
              src={item.author?.profilePicture || '/default-avatar.svg'}
              alt={`Avatar de ${item.author?.username || 'utilisateur'}`}
              width={isComment ? 32 : 40}
              height={isComment ? 32 : 40}
              className={`${isComment ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover`}
            />
          </div>
        </Link>
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            {/* Nom et username cliquables avec Link */}
            <Link 
              href={`/profile/${typeof item.author === 'string' ? item.author : item.author?._id}`}
              className="hover:underline flex items-center gap-2"
            >
              <span className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {item.author?.name || item.author?.username || 'utilisateur'}
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm hover:text-blue-500 dark:hover:text-blue-300 transition-colors">
                @{item.author?.username || 'utilisateur'}
              </span>
            </Link>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(item.createdAt)}
          </span>
        </div>
      </div>

      <div className="mb-3 whitespace-pre-wrap text-gray-900 dark:text-gray-100">
        {renderContentWithMentions(item.content)}
      </div>

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

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {item.tags.map((tag: string, index: number) => (
            <Link
              key={index}
              href={`/search?tag=${encodeURIComponent(tag)}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
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

        <button
          className={`flex items-center gap-1 transition-colors ${
            replyingCommentId === item._id 
              ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg' 
              : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setReplyingCommentId(replyingCommentId === item._id ? null : item._id);
          }}
        >
          <MdChatBubbleOutline className={`w-4 h-4 transition-transform ${
            replyingCommentId === item._id ? 'scale-110' : ''
          }`} />
          <span className="text-sm">{repliesCount}</span>
        </button>

        <button
          className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(window.location.origin + `/post/${item._id}`)
              .then(() => console.log('Lien copié dans le presse-papier'))
              .catch(() => console.error('Erreur lors de la copie du lien'));
          }}
        >
          <MdShare className="w-4 h-4" />
        </button>

        {/* Bouton de signalement dans ThreadItem */}
        <button
          className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setShowReportModal(true);
          }}
          title={t('report.report_content', 'Signaler ce contenu')}
        >
          <MdFlag className="w-4 h-4" />
        </button>

        {userId === (typeof item.author === 'string' ? item.author : item.author?._id) && (
          <button
            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteComment(item._id);
            }}
            disabled={isDeleting}
          >
            <MdDelete className="w-4 h-4" />
            {isDeleting && <span className="text-xs">...</span>}
          </button>
        )}
      </div>

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

      {/* Modal de signalement dans ThreadItem */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        postId={item._id}
      />

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
  setExpandedComments,
  onDelete,
  deletingCommentId,
  onProfileClick // Nouvelle prop
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
  currentUser: User,
  onDelete?: (commentId: string) => void,
  deletingCommentId?: string | null,
  onProfileClick?: (userId: string, username?: string) => void // Nouvelle prop
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

  // Fonction pour supprimer un commentaire et tous ses enfants de façon récursive
  const handleCommentDelete = (commentId: string) => {
    const findAllChildComments = (parentCommentId: string): string[] => {
      const children = allComments
        .filter(c => c.parentPost === parentCommentId)
        .map(c => c._id);
      
      const allChildren = [...children];
      children.forEach(childId => {
        allChildren.push(...findAllChildComments(childId));
      });
      
      return allChildren;
    };

    const idsToDelete = [commentId, ...findAllChildComments(commentId)];
    
    idsToDelete.forEach(id => {
      onDelete?.(id);
    });
  };

  return (
    <div className="space-y-3">
      {levelComments.map(comment => {
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
              onDelete={handleCommentDelete}
              deletingCommentId={deletingCommentId}
              onProfileClick={onProfileClick} // Passer la prop
            />

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
                  onDelete={onDelete}
                  deletingCommentId={deletingCommentId}
                  onProfileClick={onProfileClick} // Passer la prop
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