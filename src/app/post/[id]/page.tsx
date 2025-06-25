'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThreadItem, FlatComments } from '../../../components/Post';
import PostForm from '../../../components/PostForm';
import { Header, Follows } from '@/components/LayoutParts';
import AppSidebar from '@/components/AppSidebar';
import { useTranslation } from 'react-i18next';

export default function PostFocusPage({ params }: { params: { id: string } }) {
  const { t } = useTranslation();
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
        let token = '';
        if (typeof window !== 'undefined') {
          token = localStorage.getItem('token') || '';
        }
        // Récupération du post principal
        const resPost = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${params.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!resPost.ok) throw new Error(t('post.error_loading_post'));
        const postData = await resPost.json();
        setPost(postData);
        
        // Récupération des commentaires de premier niveau
        const resComments = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${params.id}/comments`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!resComments.ok) throw new Error(t('post.error_loading_comments'));
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
            console.error(`${t('post.error_loading_subcomments', { id: comment._id })}:`, error);
          }
        }
        
        console.log('Total de commentaires chargés:', allComments.length);
        setComments(allComments);
      } catch (e: any) {
        setError(e.message || t('post.unknown_error'));
      } finally {
        setLoading(false);
      }
    };
    if (typeof window !== 'undefined') {
      fetchData();
    }
  }, [params.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return t('post.just_now');
    if (diffInSeconds < 3600) return t('post.minutes_ago', { minutes: Math.floor(diffInSeconds / 60) });
    if (diffInSeconds < 86400) return t('post.hours_ago', { hours: Math.floor(diffInSeconds / 3600) });
    if (diffInSeconds < 604800) return t('post.days_ago', { days: Math.floor(diffInSeconds / 86400) });
    const locale = t('lang') === 'fr' ? 'fr-FR' : 'en-US';
    return t('post.date_format', { date: date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) })
};

  const refreshComments = async () => {
    try {
      let token = '';
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('token') || '';
      }
      // Récupération des commentaires de premier niveau
      const resComments = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${params.id}/comments`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!resComments.ok) throw new Error(t('post.error_loading_comments'));
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
          console.error(`${t('post.error_loading_subcomments', { id: comment._id })}:`, error);
        }
      }
      
      console.log('Total de commentaires rafraîchis:', allComments.length);
      setComments(allComments);
    } catch (error) {
      console.error(t('post.error_refreshing_comments'), error);
    }
  };

  const refreshPost = async () => {
    try {
      let token = '';
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('token') || '';
      }
      const resPost = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${params.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!resPost.ok) throw new Error(t('post.error_loading_post'));
      const postData = await resPost.json();
      setPost(postData);
    } catch {}
  };

  if (loading) return <div className="p-8 text-center text-gray-500">{t('general.loading')}</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!post) return <div className="p-8 text-center text-gray-500">{t('post.not_found')}</div>;

  const repliesCount = comments.filter(c => c.parentPost === post._id).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex flex-col font-sans text-gray-900 dark:text-gray-100">
      <Header />
      <div className="flex flex-1">
        <AppSidebar className="hidden md:flex" />
        <main className="flex-1 max-w-2xl mx-auto py-10 px-4 flex flex-col relative">
          <div className="mb-4 flex items-center">
            <button onClick={() => router.back()} className="text-blue-600 hover:underline">←{t('general.back')}</button>
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
            />
          </div>
          <div className="flex-1 overflow-y-auto pb-32">
            <FlatComments 
              parentId={post._id} 
              formatDate={formatDate} 
              allComments={comments} 
              replyingCommentId={replyingCommentId} 
              setReplyingCommentId={setReplyingCommentId} 
              onLike={refreshComments} 
              expandedComments={expandedComments}
              setExpandedComments={setExpandedComments}
            />
          </div>
          <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 dark:from-gray-900/90 to-transparent pt-4 z-30">
            <PostForm 
              parentPostId={post._id} 
              onPostCreated={() => {
                // Rafraîchir les commentaires après la création d'un nouveau commentaire
                refreshComments();
                refreshPost();
              }} 
              placeholder="Répondre..." 
            />
          </div>
        </main>
        <Follows />
      </div>
    </div>
  );
}