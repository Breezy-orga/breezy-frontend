'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useUser } from '../contexts/UserContext'

interface SuggestedUser {
  _id: string
  username: string
  displayName: string
  profilePicture: string
  followers: string[]
  isVerified?: boolean
}

interface RightSidebarProps {
  className?: string
}

export default function RightSidebar({ className = '' }: RightSidebarProps) {
  const { t } = useTranslation()
  const { user } = useUser()
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) {
      setFollowingIds(new Set(user.following.map(f => typeof f === 'string' ? f : f._id)))
    }
  }, [user])

  useEffect(() => {
    fetchSuggestedUsers()
  }, [])

  const fetchSuggestedUsers = async () => {
    try {
      setLoading(true)
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBaseUrl}/users/suggested`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuggestedUsers(data.slice(0, 5)) // Limiter à 5 suggestions
      }
    } catch (error) {
      console.error('Erreur lors du chargement des suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (userId: string) => {
    try {
      const isFollowing = followingIds.has(userId)
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBaseUrl}/users/${userId}/${isFollowing ? 'unfollow' : 'follow'}`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        setFollowingIds(prev => {
          const newSet = new Set(prev)
          if (isFollowing) {
            newSet.delete(userId)
          } else {
            newSet.add(userId)
            // Supprimer l'utilisateur des suggestions quand on le suit
            setSuggestedUsers(prevUsers => prevUsers.filter(user => user._id !== userId))
          }
          return newSet
        })
      }
    } catch (error) {
      console.error('Erreur lors du suivi/désuivi:', error)
    }
  }

  return (
    <aside className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-y-auto ${className}`}>
      <div className="p-6">
        {/* Section Suggestions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('rightSidebar.suggestions')}
          </h3>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 animate-pulse">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-1"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {suggestedUsers.map((suggestedUser) => (
                <div key={suggestedUser._id} className="flex items-center justify-between">
                  <Link 
                    href={`/profile/${suggestedUser.username}`}
                    className="flex items-center space-x-3 flex-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors"
                  >
                    <div className="relative">
                      <Image
                        src={suggestedUser.profilePicture || '/default-avatar.png'}
                        alt={`Photo de profil de ${suggestedUser.username}`}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {suggestedUser.isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {suggestedUser.displayName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{suggestedUser.username}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {suggestedUser.followers.length} {t('rightSidebar.followers')}
                      </p>
                    </div>
                  </Link>
                  
                  <button
                    onClick={() => handleFollow(suggestedUser._id)}
                    className={`ml-2 px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      followingIds.has(suggestedUser._id)
                        ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {followingIds.has(suggestedUser._id) ? t('rightSidebar.following') : t('rightSidebar.follow')}
                  </button>
                </div>
              ))}
              
              {suggestedUsers.length === 0 && !loading && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  {t('rightSidebar.noSuggestions')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
