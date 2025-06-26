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
  const [expandedComments, setExpandedComments] = useState<Array<{ id: string, maxDisplayed: number }>>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  // Récupère l'utilisateur connecté au montage
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/profile/me', { credentials: 'include' });
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
        let token = '';
        if (typeof window !== 'undefined') {
          token = localStorage.getItem('token') || '';
        }
        // Récupération du post principal
        const resPost = await fetch(`/api/posts/${params.id}`, {
          credentials: 'include'
        });
        if (!resPost.ok) throw new Error(t('post.error_loading_post'));
        const postData = await resPost.json();
        setPost(postData);

        // Récupération des commentaires de premier niveau
        const resComments = await fetch(`/api/posts/${params.id}/comments`, {
          credentials: 'include'
        });
        if (!resComments.ok) throw new Error(t('post.error_loading_comments'));
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
    if (diffInSeconds < 3600) return t('post.minutes_ago', { count: Math.floor(diffInSeconds / 60) });
    if (diffInSeconds < 86400) return t('post.hours_ago', { count: Math.floor(diffInSeconds / 3600) });
    if (diffInSeconds < 604800) return t('post.days_ago', { count: Math.floor(diffInSeconds / 86400) });
    const locale = t('lang') === 'fr' ? 'fr-FR' : 'en-US';
    return t('post.date_format', { date: date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) })
  };

  const refreshComments = async () => {
    try {
      const resComments = await fetch(`/api/posts/${params.id}/comments`, {
        credentials: 'include'
      });
      if (!resComments.ok) throw new Error(t('post.error_loading_comments'));
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
      const resPost = await fetch(`/api/posts/${params.id}`, {
        credentials: 'include'
      });
      if (!resPost.ok) throw new Error(t('post.error_loading_post'));
      const postData = await resPost.json();
      setPost(postData);
    } catch {}
  };

  if (loading || !currentUser) return <div className="p-6 text-center text-gray-500">{t('general.loading')}</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!post) return <div className="p-6 text-center text-gray-500">{t('post.not_found')}</div>;

  const repliesCount = comments.filter(c => c.parentPost === post._id).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex flex-col font-sans text-gray-900 dark:text-gray-100">
      <Header />
      <div className="flex flex-1 w-full">
        <AppSidebar className="hidden md:flex" />
        <main className="flex-1 w-full max-w-full md:max-w-2xl mx-auto py-4 px-2 sm:py-8 sm:px-4 flex flex-col relative">
          <div className="mb-2 sm:mb-4 flex items-center">
            <button onClick={() => router.back()} className="text-blue-600 hover:underline text-sm sm:text-base">←{t('general.back')}</button>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-md border border-blue-200 dark:border-blue-700 p-3 sm:p-6 mb-4 sm:mb-6">
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
            <FlatComments 
              parentId={post._id} 
              formatDate={formatDate} 
              allComments={comments} 
              replyingCommentId={replyingCommentId} 
              setReplyingCommentId={setReplyingCommentId} 
              onLike={refreshComments} 
              expandedComments={expandedComments}
              setExpandedComments={setExpandedComments}
              currentUser={currentUser}
            />
          </div>
          <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 dark:from-gray-900/90 to-transparent pt-2 sm:pt-4 z-30">
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
        <Follows />
      </div>
    </div>
  );
}