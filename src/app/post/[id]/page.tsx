'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThreadItem, FlatComments } from '../../../components/Post';
import Link from 'next/link';
import PostForm from '../../../components/PostForm';
import { Header, Sidebar, Follows } from '@/components/LayoutParts';

export default function PostFocusPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const resPost = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${params.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!resPost.ok) throw new Error('Erreur lors du chargement du post');
        const postData = await resPost.json();
        setPost(postData);
        const resComments = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${params.id}/comments`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!resComments.ok) throw new Error('Erreur lors du chargement des commentaires');
        const commentsData = await resComments.json();
        setComments(commentsData);
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
      const resComments = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${params.id}/comments`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!resComments.ok) throw new Error('Erreur lors du chargement des commentaires');
      const commentsData = await resComments.json();
      setComments(commentsData);
    } catch {}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex flex-col font-sans text-gray-900 dark:text-gray-100">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
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
            />
          </div>
          <div className="flex-1 overflow-y-auto pb-32">
            <FlatComments parentId={post._id} formatDate={formatDate} allComments={comments} replyingCommentId={replyingCommentId} setReplyingCommentId={setReplyingCommentId} onLike={refreshComments} />
          </div>
          <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 dark:from-gray-900/90 to-transparent pt-4 z-30">
            <PostForm parentPostId={post._id} onPostCreated={() => {}} placeholder="Répondre..." />
          </div>
        </main>
        <Follows />
      </div>
    </div>
  );
} 