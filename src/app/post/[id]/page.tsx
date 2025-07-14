'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThreadItem, FlatComments } from '../../../components/Post';
import PostForm from '../../../components/PostForm';
import { useTranslation } from 'react-i18next';
import { formatRelativeDate } from '@/i18n/formatRelativeDate';
import type { Post as PostType } from '@/types/models'; 

async function fetchAllCommentsRecursive(parentId: string): Promise<any[]> {
  try {
    const res = await fetch(`/api/posts/${parentId}/comments`, { 
      credentials: 'include' 
    });
    
    if (!res.ok) {
      console.error('Erreur lors de la récupération des commentaires:', res.status);
      return [];
    }
    
    const directComments = await res.json();
    let allComments = [...directComments];
    
    for (const comment of directComments) {
      const subComments = await fetchAllCommentsRecursive(comment._id);
      allComments = [...allComments, ...subComments];
    }
    
    return allComments;
  } catch (error) {
    console.error('Erreur lors de la récupération récursive des commentaires:', error);
    return [];
  }
}

export default function PostFocusPage({ params }: { params: { id: string } }) {
  const { t, i18n } = useTranslation();
  const [post, setPost] = useState<PostType | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Array<{ id: string; maxDisplayed: number }>>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [deletedComments, setDeletedComments] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/users/me', { credentials: 'include' });
        if (!response.ok) throw new Error('Utilisateur non authentifié');
        const user = await response.json();
        setCurrentUser({
          ...user,
          profilePicture: user.profilePicture || '/default-avatar.svg'
        });
      } catch {
        setCurrentUser({
          _id: '',
          username: 'utilisateur',
          email: '',
          profilePicture: '/default-avatar.svg'
        });
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const resPost = await fetch(`/api/posts/${params.id}`, { credentials: 'include' });
        if (!resPost.ok) throw new Error('Erreur lors du chargement du post');
        const postData = await resPost.json();
        setPost(postData);

        const allComments = await fetchAllCommentsRecursive(params.id);
        setComments(allComments);
      } catch (e: any) {
        setError(e.message || 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const refreshComments = async () => {
    const allComments = await fetchAllCommentsRecursive(params.id);
    setComments(allComments);
  };

  const refreshPost = async () => {
    try {
      const res = await fetch(`/api/posts/${params.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Erreur lors du rafraîchissement du post');
      const postData = await res.json();
      setPost(postData);
    } catch (err) {
      console.error('refreshPost error:', err);
    }
  };

  const handlePostLike = (update: { liked: boolean; totalLikes: number }) => {
    if (!post || !currentUser) return;
    setPost(prev => {
      if (!prev) return prev;
      const userId = currentUser._id;
      let newLikes = prev.likes as string[];
      if (update.liked) {
        if (!newLikes.includes(userId)) newLikes = [...newLikes, userId];
      } else {
        newLikes = newLikes.filter(id => id !== userId);
      }
      return { ...prev, likes: newLikes };
    });
  };

  const handleCommentLike = (
    commentId: string,
    liked: boolean,
    totalLikes: number
  ) => {
    setComments(prev =>
      prev.map(c =>
        c._id === commentId
          ? {
              ...c,
              likes: liked
                ? [...c.likes, currentUser._id]
                : c.likes.filter((id: string) => id !== currentUser._id),
            }
          : c
      )
    );
  };

  // Fonction améliorée pour supprimer un commentaire de façon dynamique
  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return;
    
    const commentToDelete = comments.find(c => c._id === commentId);
    if (!commentToDelete) return;

    const commentAuthorId = typeof commentToDelete.author === 'string'
      ? commentToDelete.author
      : commentToDelete.author?._id;

    const postAuthorId = typeof post?.author === 'string'
      ? post.author
      : post?.author?._id;

    const canDelete = commentAuthorId === currentUser._id ||
                     (post && postAuthorId === currentUser._id);

    if (!canDelete) {
      console.error('Utilisateur non autorisé à supprimer ce commentaire');
      return;
    }

    const findAllChildComments = (parentCommentId: string): string[] => {
      const children = comments
        .filter(c => c.parentPost === parentCommentId)
        .map(c => c._id);
      
      const allChildren = [...children];
      children.forEach(childId => {
        allChildren.push(...findAllChildComments(childId));
      });
      
      return allChildren;
    };

    const idsToDelete = [commentId, ...findAllChildComments(commentId)];
    
    setDeletingCommentId(commentId);
    
    try {
      const response = await fetch(`/api/posts/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur lors de la suppression:', errorData.message);
        return;
      }

      setComments(prevComments => 
        prevComments.filter(comment => !idsToDelete.includes(comment._id))
      );
      
      // Marquer les commentaires comme supprimés
      setDeletedComments(prev => {
        const newSet = new Set(prev);
        idsToDelete.forEach(id => newSet.add(id));
        return newSet;
      });
      
    } catch (error) {
      console.error('Erreur lors de la suppression du commentaire:', error);
    } finally {
      setDeletingCommentId(null);
    }
  };

  // Formatage date relative (utilitaire partagé)
  const formatDate = (dateString: string) => formatRelativeDate(dateString, t);

  // Filtrer les commentaires supprimés
  const visibleComments = comments.filter(comment => !deletedComments.has(comment._id));
  const repliesCount = post ? visibleComments.filter(c => c.parentPost === post._id).length : 0;

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-[#0c0e1a] dark:via-[#141622] dark:to-[#0c0e1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">{t('post.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-[#0c0e1a] dark:via-[#141622] dark:to-[#0c0e1a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-4">{t('post.error', { error })}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('post.retry', 'Réessayer')}
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-[#0c0e1a] dark:via-[#141622] dark:to-[#0c0e1a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">{t('post.not_found')}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            {t('post.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-[#0c0e1a] dark:via-[#141622] dark:to-[#0c0e1a] flex flex-col font-sans text-gray-900 dark:text-gray-100 transition-colors">
      <div className="flex flex-1 w-full">
        <main className="flex-1 w-full max-w-full md:max-w-2xl mx-auto py-4 px-2 sm:py-8 sm:px-4 flex flex-col relative">
          {/* Bouton retour */}
          <div className="mb-2 sm:mb-4 flex items-center">
            <button
              onClick={() => router.back()}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm sm:text-base transition-colors"
            >
              ← {t('post.back')}
            </button>
          </div>

          {/* Post principal */}
          <div className="bg-white dark:bg-[#151925] rounded-xl sm:rounded-2xl shadow-md border border-blue-200 dark:border-blue-800 p-3 sm:p-6 mb-4 sm:mb-6 transition-colors">
            <ThreadItem
              item={post}
              formatDate={formatDate}
              repliesCount={repliesCount}
              onReply={() => setReplyingCommentId(replyingCommentId === post._id ? null : post._id)}
              replyingCommentId={replyingCommentId}
              setReplyingCommentId={setReplyingCommentId}
              isClickable={false}
              onLike={(
                _itemId: string,
                _liked: boolean,
                _totalLikes: number
              ) => {
                refreshPost()
              }}
              onCommentCreated={refreshComments}
              currentUser={currentUser}
              onDelete={undefined}
            />
          </div>

          {/* Section commentaires */}
          <div className="flex-1 overflow-y-auto pb-24 sm:pb-32">
            {/* Message si commentaires en cours de suppression */}
            {deletingCommentId && (
              <div className="mb-4 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                  {t('post.deleting_comment', 'Suppression du commentaire en cours...')}
                </div>
              </div>
            )}

            {/* Affichage des commentaires */}
            {visibleComments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t('post.no_comments')}
              </div>
            ) : (
              <FlatComments 
                parentId={post._id} 
                formatDate={formatDate} 
                allComments={visibleComments} 
                replyingCommentId={replyingCommentId}
                setReplyingCommentId={setReplyingCommentId}
                onLike={(_id, _liked, _totalLikes) => {
                }}
                expandedComments={expandedComments}
                setExpandedComments={setExpandedComments}
                currentUser={currentUser}
                onDelete={(commentId) => {
                  if (commentId === post._id) {
                    console.warn('PROTECTION: Tentative de suppression du post principal via commentaire - BLOQUÉE');
                    return;
                  }
                  
                  // Suppression immédiate de l'état pour éviter le réaffichage
                  const findAllChildComments = (parentCommentId: string): string[] => {
                    const children = comments
                      .filter(c => c.parentPost === parentCommentId && c._id !== post._id)
                      .map(c => c._id);
                    
                    const allChildren = [...children];
                    children.forEach(childId => {
                      if (childId !== post._id) {
                        allChildren.push(...findAllChildComments(childId));
                      }
                    });
                    
                    return allChildren;
                  };

                  const idsToDelete = [commentId, ...findAllChildComments(commentId)]
                    .filter(id => id !== post._id);
                  
                  console.log('Suppression des commentaires:', idsToDelete);
                  
                  setComments(prevComments => 
                    prevComments.filter(comment => !idsToDelete.includes(comment._id))
                  );
                  
                  handleDeleteComment(commentId);
                }}
                deletingCommentId={deletingCommentId}
              />
            )}
          </div>

          {/* Message informatif si des commentaires ont été supprimés */}
          {deletedComments.size > 0 && (
            <div className="mb-4 text-center">
              <div className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg text-sm">
                ✓ {t('post.comments_deleted', `${deletedComments.size} commentaire${deletedComments.size > 1 ? 's' : ''} supprimé${deletedComments.size > 1 ? 's' : ''}`, { count: deletedComments.size })}
              </div>
            </div>
          )}

          {/* Formulaire de réponse */}
          {!replyingCommentId && (
            <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 dark:from-[#151925]/90 to-transparent pt-2 sm:pt-4 z-30 transition-colors">
              <PostForm
                parentPostId={post._id}
                onPostCreated={() => {
                  refreshComments();
                }}
                placeholder={t('post.reply_placeholder')}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}