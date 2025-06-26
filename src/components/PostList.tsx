'use client'

import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/context/CurrentUserContext'
import Post from './Post'
import { Post as PostType, User } from '@/types/models'
import api from '@/lib/axios';
import { API_ROUTES } from '@/config/api';

interface PostListProps {
  initialPosts?: PostType[];
  tab?: 'all' | 'following';
  userId?: string;
}

export default function PostList({ initialPosts = [], tab = 'all', userId }: PostListProps) {
  const [posts, setPosts] = useState<PostType[]>(initialPosts)
  const [loading, setLoading] = useState(!initialPosts.length)
  const [error, setError] = useState<string | null>(null)
  const { user: currentUser, loading: userLoading } = useCurrentUser();

  useEffect(() => {
    const shouldFetch = !initialPosts.length || 
      (userId && initialPosts.some(p => {
        const authorId = typeof p.author === 'string' ? p.author : p.author?._id;
        return authorId !== userId;
      }));
      
    if (shouldFetch) {
      fetchPosts();
    }
  }, [userId])

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let url = userId 
        ? API_ROUTES.POSTS.USER(userId)
        : tab === 'following' 
          ? API_ROUTES.POSTS.FEED(true)
          : API_ROUTES.POSTS.FEED();
          
      const response = await api.get(url);
      const fetchedPosts = Array.isArray(response.data) ? response.data : response.data.posts || [];
      
      // Si on a un userId, on filtre pour ne garder que les posts de cet utilisateur
      const filteredPosts = userId 
        ? fetchedPosts.filter((post: PostType) => {
            const authorId = typeof post.author === 'string' ? post.author : post.author?._id;
            return authorId === userId;
          })
        : fetchedPosts;
        
      setPosts(filteredPosts);
      setError(null);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Une erreur est survenue lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  }

  const handlePostCreated = (newPost: PostType) => {
    setPosts((prevPosts) => [newPost, ...prevPosts])
  }

  const handlePostDeleted = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter(post => post._id.toString() !== postId))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    )
  }

  if (!posts.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucun message à afficher
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map(post => {
        // Log pour debug et skip des posts qui causeraient une erreur
        if (!post || !post._id) {
          console.error('Post invalide détecté:', post)
          return null
        }
        
        return (
          <Post
            key={post._id.toString()}
            post={post}
            currentUser={currentUser || { _id: '', username: '', email: '', profilePicture: '/default-avatar.png' } as User}
            onLike={async (postId) => {
              await fetchPosts()
            }}
            onComment={async (postId, content) => {
              await fetchPosts()
            }}
            onShare={(postId) => {
              // Implémenter le partage
              console.log('Partager le post:', postId)
            }}
          />
        )
      })}
    </div>
  )
} 