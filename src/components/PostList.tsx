'use client'

import { useState, useEffect } from 'react'
import Post from './Post'
import { Post as PostType, User } from '@/types/models'
import { useTranslation } from 'react-i18next'
import { formatRelativeDate } from '../i18n/formatRelativeDate'

interface PostListProps {
  initialPosts?: PostType[]
  fetchUrl: string
  onDelete?: (postId: string) => void
}

export default function PostList({ fetchUrl, initialPosts, onDelete }: PostListProps) {
  const { t } = useTranslation()
  const [posts, setPosts] = useState<PostType[]>(initialPosts || []);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const updatePostInState = (updatedPost: PostType) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post._id === updatedPost._id ? updatedPost : post
      )
    )
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch(fetchUrl, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des messages')
      }

      const data = await response.json()
      setPosts(data)
      setError(null)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPosts(initialPosts || []);
  }, [initialPosts]);

  useEffect(() => {
    fetchPosts()
  }, [fetchUrl])

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/users/me', {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Utilisateur non authentifié')
      }
      const user = await response.json()
      setCurrentUser({
        ...user,
        profilePicture: user.profilePicture || '/default-avatar.svg',
      })
    } catch (error) {
      setCurrentUser({
        _id: '',
        username: 'utilisateur',
        email: '',
        profilePicture: '/default-avatar.svg',
        role: 'user',
      })
      console.error("Erreur lors de la récupération de l'utilisateur:", error)
    }
  }

  // const handlePostDeleted = (postId: string) => {
  //   setPosts(prevPosts => prevPosts.filter(post => post._id.toString() !== postId))
  // }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-500">{t('postlist.loading')}</span>
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

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {t('postlist.empty')}
        </div>
      ) : (
        posts.map(post => {
          if (!post || !post._id) {
            console.error('Post invalide détecté:', post)
            return null
          }

          return (
            <Post
              key={post._id.toString()}
              post={post}
              currentUser={currentUser || {
                _id: '',
                username: '',
                email: '',
                profilePicture: '/default-avatar.png',
                role: 'user'
              }}
              onLike={async (postId, updatedPost) => {
                updatePostInState(updatedPost)
              }}
              onComment={async (postId, updatedPost) => {
                updatePostInState(updatedPost)
              }}
              onShare={(postId) => {
                console.log('Partager le post:', postId)
              }}
              onDelete={onDelete}
            />
          )
        })
      )}
    </div>
  )
}