'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThreadItem, FlatComments } from '../../../components/Post';
import PostForm from '../../../components/PostForm';
import { useTranslation } from 'react-i18next';

async function fetchAllCommentsRecursive(parentId: string): Promise<any[]> {
  let all: any[] = [];
  const res = await fetch(`/api/posts/${parentId}/comments`, { credentials: 'include' });
  if (!res.ok) return all;
  const data = await res.json();
  all = [...data];
  for (const comment of data) {
    const children = await fetchAllCommentsRecursive(comment._id);
    all.push(...children);
  }
  return all;
}

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

  // Récupère l'utilisateur connecté
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

  // Récupération du post et des commentaires (récursif)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Récupère le post principal
        const resPost = await fetch(`/api/posts/${params.id}`, { credentials: 'include' });
        if (!resPost.ok) throw new Error('Erreur lors du chargement du post');
        const postData = await resPost.json();
        setPost(postData);

        // Récupère TOUS les commentaires de tous niveaux
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

  // Refresh commentaires
  const refreshComments = async () => {
    const allComments = await fetchAllCommentsRecursive(params.id);
    setComments(allComments);
  };

  // Refresh post principal (pour likes sur le post principal)
  const refreshPost = async () => {
    try {
      const resPost = await fetch(`/api/posts/${params.id}`, { credentials: 'include' });
      if (!resPost.ok) throw new Error('Erreur lors du chargement du post');
      const postData = await resPost.json();
      setPost(postData);
    } catch {}
  };

  // Formatage date relative
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return t('post.just_now');
    if (diffInSeconds < 3600) return t('post.minutes_ago', { count: Math.floor(diffInSeconds / 60) });
    if (diffInSeconds < 86400) return t('post.hours_ago', { count: Math.floor(diffInSeconds / 3600) });
    if (diffInSeconds < 604800) return t('post.days_ago', { count: Math.floor(diffInSeconds / 86400) });
    return date.toLocaleDateString();
  };

  if (loading || !currentUser) return <div className="p-6 text-center text-gray-500 dark:text-gray-400">{t('post.loading')}</div>;
  if (error) return <div className="p-6 text-center text-red-500 dark:text-red-400">{t('post.error', { error })}</div>;
  if (!post) return <div className="p-6 text-center text-gray-500 dark:text-gray-400">{t('post.not_found')}</div>;

  const repliesCount = comments.filter(c => c.parentPost === post._id).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100
      dark:from-[#0c0e1a] dark:via-[#141622] dark:to-[#0c0e1a] flex flex-col font-sans text-gray-900 dark:text-gray-100 transition-colors">
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
              onReply={() => setReplyingCommentId(post._id)}
              replyingCommentId={replyingCommentId}
              setReplyingCommentId={setReplyingCommentId}
              isClickable={false}
              onLike={refreshPost}
              currentUser={currentUser}
            />
          </div>
          {/* Commentaires */}
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
          {/* Formulaire réponse */}
          {!replyingCommentId && (
            <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 dark:from-[#151925]/90 to-transparent pt-2 sm:pt-4 z-30 transition-colors">
              <PostForm
                parentPostId={post._id}
                onPostCreated={() => {
                  refreshComments();
                  refreshPost();
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
