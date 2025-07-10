'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThreadItem, FlatComments } from '../../../components/Post';
import PostForm from '../../../components/PostForm';
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
  const [post, setPost] = useState<PostType | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Array<{ id: string; maxDisplayed: number }>>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
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

  // Formatage date relative
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `À l'instant`;
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
    return date.toLocaleDateString();
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

  if (loading || !currentUser) {
    return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Chargement...</div>;
  }
  if (error) {
    return <div className="p-6 text-center text-red-500 dark:text-red-400">{error}</div>;
  }
  if (!post) {
    return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Aucun post trouvé</div>;
  }

  const repliesCount = comments.filter(c => c.parentPost === post._id).length;

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
              ← Retour
            </button>
          </div>

          {/* Post principal */}
          <div className="bg-white dark:bg-[#151925] rounded-xl sm:rounded-2xl shadow-md border border-blue-200 dark:border-blue-800 p-3 sm:p-6 mb-4 sm:mb-6 transition-colors">
            <ThreadItem
              item={post}
              formatDate={formatDate}
              repliesCount={repliesCount}
              onReply={() => setReplyingCommentId(post._id)}
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
            />
          </div>

          {/* Commentaires */}
          <div className="flex-1 overflow-y-auto pb-24 sm:pb-32">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aucun commentaire pour l'instant. Soyez le premier à commenter !
              </div>
            ) : (
              <FlatComments 
                parentId={post._id} 
                formatDate={formatDate} 
                allComments={comments} 
                replyingCommentId={replyingCommentId}
                setReplyingCommentId={setReplyingCommentId}
                onLike={(_id, _liked, _totalLikes) => {
                  refreshComments()
                }}
                expandedComments={expandedComments}
                setExpandedComments={setExpandedComments}
                currentUser={currentUser}
              />
            )}
          </div>

          {/* Formulaire réponse */}
          {!replyingCommentId && (
            <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 dark:from-[#151925]/90 to-transparent pt-2 sm:pt-4 z-30 transition-colors">
              <PostForm
                parentPostId={post._id}
                onPostCreated={() => {
                  refreshComments();
                }}
                placeholder="Répondre..."
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}