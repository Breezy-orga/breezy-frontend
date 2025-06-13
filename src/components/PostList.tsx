'use client'

import { useState, useEffect } from 'react'
import Post from './Post'
import { Post as PostType, User } from '@/types/models'

interface PostListProps {
  initialPosts?: PostType[]
  fetchUrl: string
}

export default function PostList({ initialPosts = [], fetchUrl }: PostListProps) {
  const [posts, setPosts] = useState<PostType[]>(initialPosts)
  const [loading, setLoading] = useState(!initialPosts.length)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    if (!initialPosts.length) {
      fetchPosts()
    }
    // Récupérer l'utilisateur courant
    const userId = localStorage.getItem('userId')
    if (userId) {
      fetchUser(userId)
    }
  }, [])

  const fetchUser = async (userId: string) => {
    if (!userId) {
      console.warn('Aucun ID utilisateur fourni pour la récupération')
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
        credentials: 'include',
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Utilisateur non trouvé, utilisation d\'un utilisateur par défaut')
          // Créer un utilisateur par défaut pour éviter les erreurs
          setCurrentUser({
            _id: userId,
            username: 'utilisateur',
            profilePicture: '/default-avatar.svg'
          })
          return
        }
        throw new Error(`Erreur HTTP: ${response.status}`)
      }
      
      const user = await response.json()
      if (!user) {
        throw new Error('Aucune donnée utilisateur reçue')
      }
      
      // S'assurer que l'utilisateur a une photo de profil
      const userWithDefaultAvatar = {
        ...user,
        profilePicture: user.profilePicture || '/default-avatar.svg'
      }
      
      setCurrentUser(userWithDefaultAvatar)
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error)
      // En cas d'erreur, définir un utilisateur par défaut
      setCurrentUser({
        _id: userId,
        username: 'utilisateur',
        profilePicture: '/default-avatar.svg'
      })
    }
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