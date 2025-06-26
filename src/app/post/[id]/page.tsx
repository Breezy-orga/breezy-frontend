'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Post from '@/components/Post';
import Link from 'next/link';
import PostForm from '@/components/PostForm';
import { Follows } from '@/components/LayoutParts';
import AppSidebar from '@/components/AppSidebar';
import { User } from '@/types/models';

export default function PostFocusPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  // État pour suivre les commentaires qui ont été développés et combien de réponses afficher
  const [expandedComments, setExpandedComments] = useState<Array<{ id: string, maxDisplayed: number }>>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Récupération du post principal
        const resPost = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${params.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!resPost.ok) throw new Error('Erreur lors du chargement du post');
        const postData = await resPost.json();
        setPost(postData);
        
        // Récupération des commentaires de premier niveau
        const resComments = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${params.id}/comments`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!resComments.ok) throw new Error('Erreur lors du chargement des commentaires');
        const commentsData = await resComments.json();
        
        // Pour chaque commentaire de premier niveau, récupérer ses sous-commentaires
        const allComments = [...commentsData];
        
        // Récupérer les sous-commentaires pour chaque commentaire de premier niveau
        for (const comment of commentsData) {
          try {
            const resSubComments = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${comment._id}/comments`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (resSubComments.ok) {
              const subCommentsData = await resSubComments.json();
              // Ajouter les sous-commentaires à la liste complète
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
      // Récupération des commentaires de premier niveau
      const resComments = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${params.id}/comments`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!resComments.ok) throw new Error('Erreur lors du chargement des commentaires');
      const commentsData = await resComments.json();
      
      // Pour chaque commentaire de premier niveau, récupérer ses sous-commentaires
      const allComments = [...commentsData];
      
      // Récupérer les sous-commentaires pour chaque commentaire de premier niveau
      for (const comment of commentsData) {
        try {
          const resSubComments = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${comment._id}/comments`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (resSubComments.ok) {
            const subCommentsData = await resSubComments.json();
            // Ajouter les sous-commentaires à la liste complète
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
      const resPost = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${params.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!resPost.ok) throw new Error('Erreur lors du chargement du post');
      const postData = await resPost.json();
      setPost(postData);
    } catch {}
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>;
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <div className="flex flex-col md:flex-row">
        <AppSidebar className="hidden md:flex" />
        
        {/* Main content container with consistent width and spacing as feed */}
        <main className="flex-1 max-w-4xl w-full mx-auto py-4 md:py-8 px-4 xl:px-0 xl:mr-72">
          <div className="space-y-6">
            {/* Back button with responsive spacing */}
            <button 
              onClick={() => router.back()} 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline mb-4 sm:mb-6 inline-flex items-center transition-colors duration-200"
              aria-label="Retour à la page précédente"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm sm:text-base">Retour</span>
            </button>

            {/* Main post */}
            {post && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md dark:hover:shadow-lg">
                <Post 
                  post={post}
                  currentUser={currentUser}
                  onLike={refreshPost}
                  onComment={async (postId, content) => {
                    await refreshComments();
                    await refreshPost();
                  }}
                  onShare={(postId) => {
                    console.log('Sharing post:', postId);
                    // Implement share functionality here
                  }}
                />
              </div>
            )}

            {/* Comments section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200">
              {/* Comments header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Commentaires {comments.length > 0 && `(${comments.length})`}
                </h2>
              </div>
              
              {/* Comments list */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {comments.length > 0 ? (
                  comments.map(comment => (
                    <div key={comment._id.toString()} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-150">
                      <Post
                        post={comment}
                        currentUser={currentUser}
                        onLike={refreshComments}
                        onComment={async (commentId, content) => {
                          await refreshComments();
                        }}
                        onShare={(commentId) => {
                          console.log('Sharing comment:', commentId);
                          // Implement share functionality here
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                    Aucun commentaire pour ce post
                  </div>
                )}
              </div>
              
              {/* Fixed comment form at bottom */}
              <div className="sticky bottom-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-100 dark:border-gray-700 p-4">
                <div className="max-w-2xl mx-auto">
                  <PostForm 
                    parentPostId={post?._id} 
                    onPostCreated={async () => {
                      await refreshComments();
                      await refreshPost();
                      // Scroll to the new comment
                      window.scrollTo({
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                      });
                    }} 
                    placeholder="Ajouter un commentaire..." 
                  />
                </div>
              </div>
            </div>
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