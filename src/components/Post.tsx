'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MdChatBubbleOutline, MdShare, MdMoreHoriz, MdRepeat } from 'react-icons/md'
import LikeButton from './LikeButton'
import PostForm from './PostForm'
import PostHeader from './post/PostHeader'
import PostContent from './post/PostContent'
import PostActions from './post/PostActions'
import MediaModal from './ImageModal';
import type { Post as PostType, User } from '@/types/models'

// Type étendu pour ajouter des propriétés temporaires en attendant la mise à jour du backend
interface ExtendedPost extends PostType {
  commentsCount?: number;
}

interface PostProps {
  post: ExtendedPost
  currentUser: User | null
  onLike: (postId: string) => Promise<void>
  onComment: (postId: string, content: string) => Promise<void>
  onShare: (postId: string) => void
}

// Utilisateur par défaut en cas d'absence
const defaultUser: User = {
  _id: 'unknown',
  username: 'utilisateur',
  profilePicture: '/default-avatar.svg'
}

export default function Post({
  post,
  currentUser,
  onLike,
  onComment,
  onShare,
}: PostProps) {
  const [isDeleted, setIsDeleted] = useState(false)
  
  // Si le post a été supprimé, ne rien afficher
  if (isDeleted) {
    return null;
  }
  // Utiliser l'utilisateur par défaut si currentUser est null/undefined
  const safeCurrentUser = currentUser || defaultUser
  const [showCommentForm, setShowCommentForm] = useState(false)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const getUserId = () => localStorage.getItem('userId') || ''
  const isLikedByUser = (likes: any[]) => likes.some(like => (like._id || like) === getUserId())
  const [isLiked, setIsLiked] = useState(isLikedByUser(post.likes))
  const [likesCount, setLikesCount] = useState(post.likes.length)
  const [comments, setComments] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0)  // État pour suivre les commentaires qui ont été développés et combien de réponses afficher
  const [expandedComments, setExpandedComments] = useState<Array<{ id: string, maxDisplayed: number }>>([])  
  // Nombre de sous-commentaires affichés
  const displayedComments = 5
  const clickableRef = useRef<HTMLDivElement>(null)

  // Charger les commentaires au chargement initial
  useEffect(() => {
    fetchComments()
  }, [])
  
  // Mettre à jour le compteur de commentaires
  useEffect(() => {
    if (post.commentsCount !== undefined) {
      setCommentsCount(post.commentsCount)
    }
  }, [post.commentsCount])

  useEffect(() => {
    setIsLiked(isLikedByUser(post.likes))
  }, [post.likes])

  const fetchComments = async () => {
    setLoadingComments(true)
    setCommentsError(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${post._id}/comments`, {
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
      // Cette fonction est maintenant utilisée comme callback pour le LikeButton
      if (onLike) onLike(post._id.toString())
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
      setLoadingComments(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${post._id}/comments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      console.log('Commentaires rafraîchis:', data)
      setComments(data)
      
      // Mettre à jour le compteur de commentaires si necessaire
      if (data.length !== commentsCount) {
        setCommentsCount(data.length)
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des commentaires:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  // Fonction pour gérer le clic sur le bouton commentaire
  const handleCommentClick = () => {
    // Rediriger vers la page détaillée du post
    window.location.href = `/post/${post._id}`
  }
  
  // Fonction pour gérer l'ajout d'un nouveau commentaire
  const handleCommentSubmit = async (postId: string, content: string) => {
    try {
      const response = await onComment(postId, content)
      setShowCommentForm(false)
      
      // Actualiser les compteurs et commentaires
      setCommentsCount(prev => prev + 1)
      
      // Rafraîchir la liste des commentaires et fermer le formulaire de réponse
      await refreshComments()
      setReplyingCommentId(null)
    } catch (error) {
      console.error('Erreur lors de la publication du commentaire:', error)
    }
  }

  // Fonction pour charger plus de commentaires depuis l'API
  const loadMoreComments = async () => {
    if (loadingComments) return;
    
    setLoadingComments(true);
    setCommentsError(null);
    
    try {
      // Ajouter un paramètre skip pour la pagination
      const skip = comments.length;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${post._id}/comments?skip=${skip}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Erreur lors du chargement des commentaires');
      
      const newComments = await response.json();
      if (newComments.length > 0) {
        setComments([...comments, ...newComments]);
        
        // Mettre à jour expandedComments si nécessaire
        // Ex: remplacer par votre logique spécifique d'étalement des commentaires
      }
    } catch (e) {
      setCommentsError('Impossible de charger plus de commentaires');
      console.error('Erreur lors du chargement des commentaires:', e);
    } finally {
      setLoadingComments(false);
    }
  };

  return (
    <article className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md dark:hover:shadow-lg">
      <PostHeader
        author={post.author as unknown as User || defaultUser}
        createdAt={new Date(post.createdAt)}
        location={post.location}
      />
      <PostContent post={post} />
      <PostActions
        post={post}
        currentUser={safeCurrentUser}
        onLike={handleLike}
        onComment={handleCommentSubmit}
        onShare={(postId) => onShare(postId)}
        onPostDeleted={(postId) => {
          setIsDeleted(true);
          // Si on est dans un contexte où le parent gère les suppressions
          if (onLike) {
            // On réutilise la fonction onLike comme callback général pour les mises à jour
            onLike(post._id.toString());
          }
        }}
        onPostUpdated={(updatedPost) => {
          // Mise à jour du post dans l'interface
          post.content = updatedPost.content;
          post.media = updatedPost.media;
          post.tags = updatedPost.tags;
        }}
      />

      {/* Comments section - shown when expanded */}
      {showCommentForm && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="px-3 sm:px-4 py-2">
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <PostForm
                parentPostId={post._id}
                onPostCreated={() => {
                  refreshComments()
                  // Increment comment counter
                  setCommentsCount(prev => prev + 1)
                  commentInputRef.current?.blur()
                }}
                placeholder="Écrire un commentaire..."
              />
            </div>
          </div>
          <div className="px-3 sm:px-4 pb-3">
            {loadingComments && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                Chargement des commentaires...
              </p>
            )}
            {commentsError && (
              <p className="text-center text-sm text-red-500 dark:text-red-400 py-2">
                {commentsError}
              </p>
            )}
            {!loadingComments && !commentsError && comments.length === 0 ? (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                Aucun commentaire pour l'instant
              </p>
            ) : (
              <div className="space-y-3">
                <FlatComments 
                  parentId={post._id} 
                  formatDate={formatDate} 
                  allComments={comments} 
                  replyingCommentId={replyingCommentId}
                  setReplyingCommentId={setReplyingCommentId}
                  onLike={refreshComments}
                  expandedComments={expandedComments}
                  setExpandedComments={setExpandedComments}
                  cardStyle={true}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  )
}

function ThreadItem({ item, formatDate, repliesCount, onReply, replyingCommentId, setReplyingCommentId, children, onLike, isCommentDisplay = true }: any) {
  const getUserId = () => localStorage.getItem('userId') || ''
  const isLikedByUser = (likes: any[]) => likes.some(like => (like._id || like) === getUserId())
  const isComment = !!item.parentPost
  const [isLiked, setIsLiked] = useState(isLikedByUser(item.likes || []))
  const [likesCount, setLikesCount] = useState(item.likes?.length || 0)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSrc, setModalSrc] = useState<string>('');
  const [modalAlt, setModalAlt] = useState<string>('');
  const [modalType, setModalType] = useState<'image' | 'video'>('image');
  
  const handleLike = () => {
    // Rafraîchir les données si nécessaire
    if (onLike) onLike();
  };

  useEffect(() => {
    setIsLiked(isLikedByUser(item.likes || []))
  }, [item.likes])

  // Fonction pour ouvrir la modal avec le média sélectionné
  const openMediaModal = (src: string, alt: string = '', type: 'image' | 'video' = 'image') => {
    setModalSrc(src);
    setModalAlt(alt);
    setModalType(type);
    setModalOpen(true);
  };

  // Fonction pour obtenir la source du média (URL ou base64)
  const getMediaSrc = (media: any, index: number): string => {
    if (media.base64) {
      // Si l'image est en base64, on la décode directement
      return `data:${media.contentType || 'image/jpeg'};base64,${media.base64}`;
    }
    
    // Si c'est une URL externe complète
    if (media.url && (media.url.startsWith('http://') || media.url.startsWith('https://'))) {
      return media.url;
    }
    
    // Sinon, on utilise la nouvelle route API avec postId et index
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    return `${apiBaseUrl}/media/post/${item._id}/media/${index}?format=raw`;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 ${isComment ? "mb-2" : "mb-4"} rounded-lg shadow-md overflow-hidden`}>
      <div className="flex flex-col">
        <div className="px-4 py-3 flex gap-3 items-start">
          <Image 
            src={item.author?.profilePicture || '/default-avatar.svg'} 
            alt={`Photo de profil de ${item.author?.username || 'utilisateur'}`} 
            width={isComment ? 32 : 40} 
            height={isComment ? 32 : 40} 
            className={isComment ? "w-8 h-8 rounded-full object-cover" : "w-10 h-10 rounded-full object-cover"} 
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">{item.author?.username || 'utilisateur'}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">@{item.author?.username || 'utilisateur'}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{formatDate(item.createdAt)}</span>
            </div>
            <div className="text-gray-800 dark:text-gray-200 whitespace-pre-line mt-1">{renderTextWithMentions(item.content)}</div>
            
            {/* Affichage des médias (limité à 4) */}
            {item.media && item.media.length > 0 && (
              <div className={`mt-2 grid ${item.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                {item.media.slice(0, 4).map((media: any, index: number) => {
                  const imageSrc = getMediaSrc(media, index);
                  return (
                    <div 
                      key={index} 
                      className="relative aspect-square cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Déterminer si c'est une image ou une vidéo
                        const type = media.contentType?.startsWith('video/') ? 'video' : 'image';
                        openMediaModal(imageSrc, media.alt || `Media ${index + 1}`, type);
                      }}
                    >
                      <Image 
                        src={imageSrc} 
                        alt={media.alt || `Media ${index + 1}`} 
                        fill
                        className="object-cover"
                      />
                    </div>
                  )
                })}
              </div>
            )}
            
            {/* Bouton "Répondre" */}
            {isCommentDisplay && !isComment && repliesCount > 0 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="text-sm text-gray-500 mt-1 hover:text-blue-600 hover:underline"
              >
                Voir les {repliesCount} commentaires
              </button>
            )}
          </div>
        </div>
        
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-6">
            {/* Bouton Like */}
            <div className="flex items-center gap-1">
              <LikeButton 
                itemId={item._id.toString()} 
                itemType={isComment ? 'comment' : 'post'} 
                initialLikes={likesCount} 
                initialLikedStatus={isLiked}
                onLikeSuccess={() => handleLike()} 
                size={isComment ? "small" : "normal"}
              />
            </div>
            
            {/* Bouton Commenter */}
            <button 
              className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors" 
              onClick={(e) => { 
                e.preventDefault();
                e.stopPropagation(); 
                if (onReply) onReply(e); 
              }}
              aria-label="Commenter"
              title="Commenter"
            >
              <MdChatBubbleOutline className="w-5 h-5" />
              <span>{repliesCount || 0}</span>
            </button>
            
            {/* Bouton Republier */}
            <button 
              className="flex items-center space-x-1 text-gray-500"
              aria-label="Republier"
              title="Republier"
              onClick={(e) => {
                e.preventDefault(); 
                e.stopPropagation();
                alert('Fonctionnalité de republication à venir !'); 
              }}
            >
              <MdRepeat className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Formulaire de réponse */}
      {replyingCommentId === item._id && (
        <div className="ml-8 mt-2 pl-4">
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
      
      {/* Modal pour afficher les médias en grand */}
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

// Fonction pour rendre les mentions cliquables dans le texte
function renderTextWithMentions(text: string) {
  if (!text) return null;
  
  // Expression régulière pour détecter les @mentions
  const mentionRegex = /(@\w+)/g;
  
  // Diviser le texte en parties (texte normal + mentions)
  const parts = text.split(mentionRegex);
  
  return parts.map((part, index) => {
    // Si cette partie correspond à une mention
    if (part.match(mentionRegex)) {
      const username = part.substring(1); // Enlever le @ du début
      return (
        <Link 
          key={index} 
          href={`/(protected)/profile/${username}`} 
          className="text-blue-600 dark:text-blue-400 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    }
    // Sinon, c'est du texte normal
    return <span key={index}>{part}</span>;
  });
}

function FlatComments({ parentId, formatDate, allComments, replyingCommentId, setReplyingCommentId, onLike, expandedComments, setExpandedComments, cardStyle = false }: { 
  parentId: string | null; 
  formatDate: (date: string) => string; 
  allComments: any[]; 
  replyingCommentId: string | null;
  setReplyingCommentId: (id: string | null) => void; 
  onLike?: () => void;
  expandedComments: Array<{ id: string, maxDisplayed: number }>;
  setExpandedComments: (comments: Array<{ id: string, maxDisplayed: number }>) => void;
  cardStyle?: boolean; // Propriété pour activer le style de carte comme dans le feed
}) {
  // Nombre initial de sous-commentaires à afficher par défaut
  const maxDisplayedComments = 3;
  
  // Filtrer les commentaires directs (commentaires de premier niveau pour ce post)
  const comments = allComments.filter(c => c.parentPost === parentId);
  
  if (!comments.length) return null
  
  console.log('Affichage des commentaires:', comments.length, 'pour parent:', parentId)
  console.log('Tous les commentaires disponibles:', allComments.length)
  
  return (
    <div className="space-y-4"> 
      {comments.map(comment => {
        // Recherche des commentaires enfants pour ce commentaire
        const childComments = allComments.filter(c => c.parentPost === comment._id)
        console.log(`Commentaire ${comment._id} a ${childComments.length} réponses`)
        const repliesCount = childComments.length
        
        return (
          <div key={comment._id} className={`relative group ${cardStyle ? 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4' : 'border-t border-gray-200 dark:border-gray-700 pt-4'}`}> 
            <ThreadItem
              item={comment}
              formatDate={formatDate}
              repliesCount={repliesCount}
              onReply={(e: React.MouseEvent) => { 
                e.stopPropagation(); 
                setReplyingCommentId(comment._id);
                console.log('Répondre au commentaire:', comment._id);
              }}
              replyingCommentId={replyingCommentId}
              setReplyingCommentId={setReplyingCommentId}
              onLike={onLike}
              isComment={false}
            >
              {/* Formulaire de réponse pour ce commentaire */}
              {replyingCommentId === comment._id && (
                <div className="mt-3">
                  <PostForm
                    parentPostId={comment._id}
                    placeholder={`Répondre à @${comment.author?.username || 'utilisateur'}...`}
                    onPostCreated={() => {
                      // Fermer le formulaire de réponse
                      setReplyingCommentId(null);
                      // Rafraîchir les commentaires
                      if (onLike) onLike();
                    }}
                  />
                </div>
              )}
              
              {/* Afficher les réponses avec une indentation */}
              {repliesCount > 0 && (
                <div className="mt-3 pl-2 space-y-3">
                  {/* Afficher les sous-commentaires */}
                  {childComments.slice(0, expandedComments?.find(item => item.id === comment._id)?.maxDisplayed || maxDisplayedComments).map(reply => (
                    <div key={reply._id} className={`relative group ${cardStyle ? 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-2 border-blue-300 dark:border-blue-600 pl-3 py-2' : 'border-l-2 border-gray-200 dark:border-gray-700 pl-4'}`}>
                      <ThreadItem
                        item={reply}
                        formatDate={formatDate}
                        repliesCount={allComments.filter(c => c.parentPost === reply._id).length}
                        onReply={(e: React.MouseEvent) => { 
                          e.stopPropagation(); 
                          setReplyingCommentId(reply._id);
                          console.log('Répondre au sous-commentaire:', reply._id);
                        }}
                        replyingCommentId={replyingCommentId}
                        setReplyingCommentId={setReplyingCommentId}
                        onLike={onLike}
                        isComment={true}
                      />
                      
                      {/* Formulaire de réponse à un sous-commentaire */}
                      {replyingCommentId === reply._id && (
                        <div className="mt-2">
                          <PostForm
                            parentPostId={reply._id}
                            placeholder={`Répondre à @${reply.author?.username || 'utilisateur'}...`}
                            onPostCreated={() => {
                              // Fermer le formulaire de réponse
                              setReplyingCommentId(null);
                              // Rafraîchir les commentaires
                              if (onLike) onLike();
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Bouton "Afficher plus" si nécessaire et s'il reste des commentaires à afficher */}
                  {repliesCount > maxDisplayedComments && 
                   (!expandedComments.some(item => item.id === comment._id) || 
                    (expandedComments.find(item => item.id === comment._id)?.maxDisplayed ?? 0) < repliesCount) && (
                    <button 
                      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        console.log('Afficher plus de commentaires pour:', comment._id);
                        
                        // Au lieu de rediriger, on va augmenter le nombre de commentaires à afficher
                        const commentIndex = expandedComments.findIndex(item => item.id === comment._id);
                        if (commentIndex !== -1) {
                          // Mettre à jour le nombre de commentaires affichés pour ce commentaire spécifique
                          // Pour afficher tous les commentaires
                          const newExpandedComments = [...expandedComments];
                          newExpandedComments[commentIndex] = { ...newExpandedComments[commentIndex], maxDisplayed: repliesCount };
                          console.log('Mise à jour des commentaires étendus:', newExpandedComments);
                          setExpandedComments(newExpandedComments);
                        } else {
                          // Ajouter ce commentaire aux commentaires étendus
                          const newExpandedComments = [...expandedComments, { id: comment._id, maxDisplayed: repliesCount }];
                          console.log('Ajout aux commentaires étendus:', newExpandedComments);
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
          </div>
        )
      })}
    </div>
  )
}

export { ThreadItem, FlatComments } 