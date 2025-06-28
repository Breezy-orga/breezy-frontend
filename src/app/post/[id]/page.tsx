'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThreadItem } from '../../../components/Post';
import PostForm from '../../../components/PostForm';
import CommentsList from '../../../components/CommentsList';
// Layout components removed as per user request
import AppSidebar from '@/components/AppSidebar';
import { User } from '@/types/models';

export default function PostFocusPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Array<{ id: string, maxDisplayed: number }>>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  // Récupère l'utilisateur connecté au montage
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiBaseUrl}/profile/me`, { credentials: 'include' });
        if (!response.ok) throw new Error('Utilisateur non authentifié');
        const user = await response.json();
        setCurrentUser({
          ...user,
          profilePicture: user.profilePicture || '/default-avatar.svg'
        });
      } catch (error) {
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
        // Récupération du post principal
        const resPost = await fetch(`/api/posts/${params.id}`, {
          credentials: 'include'
        });
        if (!resPost.ok) throw new Error('Erreur lors du chargement du post');
        const postData = await resPost.json();
        setPost(postData);

        // Récupération des commentaires de premier niveau
        const resComments = await fetch(`/api/posts/${params.id}/comments`, {
          credentials: 'include'
        });
        if (!resComments.ok) throw new Error('Erreur lors du chargement des commentaires');
        const commentsData = await resComments.json();

        // Pour chaque commentaire de premier niveau, récupérer ses sous-commentaires
        const allComments = [...commentsData];

        for (const comment of commentsData) {
          try {
            const resSubComments = await fetch(`/api/posts/${comment._id}/comments`, {
              credentials: 'include'
            });
            if (resSubComments.ok) {
              const subCommentsData = await resSubComments.json();
              allComments.push(...subCommentsData);
              console.log(`Récupéré ${subCommentsData.length} sous-commentaires pour le commentaire ${comment._id}`);
            }
          } catch (error) {
            console.error(`Erreur lors du chargement des sous-commentaires pour ${comment._id}:`, error);
          }
        }

        console.log('Total de commentaires chargés:', allComments.length);
        console.log('Structure d\'un commentaire:', allComments.length > 0 ? allComments[0] : 'aucun commentaire');
        
        // Formater les commentaires pour qu'ils soient compatibles avec le composant Post
        const formattedComments = allComments.map(comment => ({
          ...comment,
          // S'assurer que tous les champs nécessaires pour Post sont présents
          content: comment.content || '',
          author: comment.author || { username: 'utilisateur', profilePicture: '/default-avatar.png' },
          createdAt: comment.createdAt || new Date().toISOString(),
          // Autres champs potentiellement nécessaires pour Post
          likes: comment.likes || [],
          comments: comment.comments || 0,
          media: comment.media || []
        }));
        
        console.log('Commentaires formatés pour Post:', formattedComments.length);
        setComments(formattedComments);
      } catch (e: any) {
        setError(e.message || 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)}j`;
    return date.toLocaleDateString();
  };

  const refreshComments = async () => {
    try {
      const resComments = await fetch(`/api/posts/${params.id}/comments`, {
        credentials: 'include'
      });
      if (!resComments.ok) throw new Error('Erreur lors du chargement des commentaires');
      const commentsData = await resComments.json();

      const allComments = [...commentsData];

      for (const comment of commentsData) {
        try {
          const resSubComments = await fetch(`/api/posts/${comment._id}/comments`, {
            credentials: 'include'
          });
          if (resSubComments.ok) {
            const subCommentsData = await resSubComments.json();
            allComments.push(...subCommentsData);
            console.log(`Rafraîchi ${subCommentsData.length} sous-commentaires pour le commentaire ${comment._id}`);
          }
        } catch (error) {
          console.error(`Erreur lors du chargement des sous-commentaires pour ${comment._id}:`, error);
        }
      }

      console.log('Total de commentaires rafraîchis:', allComments.length);
      setComments(allComments);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des commentaires:', error);
    }
  };

  const refreshPost = async () => {
    try {
      const resPost = await fetch(`/api/posts/${params.id}`, {
        credentials: 'include'
      });
      if (!resPost.ok) throw new Error('Erreur lors du chargement du post');
      const postData = await resPost.json();
      setPost(postData);
    } catch {}
  };

  if (loading || !currentUser) return <div className="p-8 text-center text-gray-500">Chargement...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!post) return <div className="p-8 text-center text-gray-500">Aucun post trouvé</div>;

  const repliesCount = comments.filter(c => c.parentPost === post._id).length;

  // Créer un utilisateur par défaut pour éviter les erreurs (comme dans PostList)  
  const currentUser: User = {
    _id: localStorage?.getItem('userId') || '',
    username: '',
    email: '',
    profilePicture: '/default-avatar.png'
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex flex-col font-sans text-gray-900 dark:text-gray-100">
      <div className="flex flex-1 w-full">
        <AppSidebar className="hidden md:flex" />
        <main className="flex-1 max-w-2xl mx-auto py-10 px-4 flex flex-col relative">
          <div className="mb-4 flex items-center">
            <button onClick={() => router.back()} className="text-blue-600 hover:underline">← Retour</button>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-blue-200 dark:border-blue-700 p-6 mb-6">
            <ThreadItem
              item={post}
              formatDate={formatDate}
              repliesCount={repliesCount}
              onReply={() => setReplyingCommentId(post._id)}
              replyingCommentId={replyingCommentId}
              setReplyingCommentId={setReplyingCommentId}
              isClickable={false}
              onLike={refreshPost}
              currentUser={currentUser}
            />
          </div>
          <div className="flex-1 overflow-y-auto pb-24 sm:pb-32">
            <CommentsList 
              comments={comments}
              currentUser={currentUser}
              onCommentUpdate={refreshComments}
              onCommentDelete={refreshComments}
              formatDate={formatDate}
              maxDepth={3}
            />
          </div>
          <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 dark:from-gray-900/90 to-transparent pt-4 z-30">
            <PostForm 
              parentPostId={post._id} 
              onPostCreated={() => {
                refreshComments();
                refreshPost();
              }} 
              placeholder="Répondre..." 
            />
          </div>
        </main>
        
        {/* Right sidebar - only visible on xl screens */}
        <div className="hidden xl:block w-72 flex-shrink-0">
          <div className="fixed right-0 top-0 h-full overflow-y-auto w-72 p-4 lg:p-6 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
            <Follows />
          </div>
        </div>
      </div>
    </div>
  );
}