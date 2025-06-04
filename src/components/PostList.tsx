'use client'

import { useState, useEffect } from 'react'
import Post from './Post'

interface Post {
  _id: string
  content: string
  author: {
    _id: string
    username: string
    name: string
    profilePicture: string
  }
  likes: string[]
  comments: Array<{
    _id: string
    content: string
    author: {
      _id: string
      username: string
      name: string
      profilePicture: string
    }
    createdAt: string
  }>
  createdAt: string
}

interface PostListProps {
  initialPosts?: Post[]
  fetchUrl: string
}

export default function PostList({ initialPosts = [], fetchUrl }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [loading, setLoading] = useState(!initialPosts.length)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialPosts.length) {
      fetchPosts()
    }
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch(fetchUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
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

  const handlePostCreated = (newPost: Post) => {
    setPosts((prevPosts: Post[]) => [newPost, ...prevPosts])
  }

  const handlePostDeleted = (postId: string) => {
    setPosts((prevPosts: Post[]) => prevPosts.filter(post => post._id !== postId))
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
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Aucun message à afficher
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <Post
          key={post._id}
          post={post}
          onLike={() => {
            // Rafraîchir la liste des posts après un like
            fetchPosts()
          }}
          onComment={() => {
            // Rafraîchir la liste des posts après un commentaire
            fetchPosts()
          }}
          isClickable={true}
        />
      ))}
    </div>
  )
} 