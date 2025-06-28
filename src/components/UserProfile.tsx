// 'use client' obligatoire pour Next.js app directory
'use client';

import { useEffect, useState } from 'react'
import api from '@/lib/axios'
import { User } from '@/types/models'
import PostList from './PostList'
import Link from 'next/link'
import { MdArrowBack, MdEdit } from 'react-icons/md'
import { useUser } from '@/contexts/UserContext'
import { useTranslation } from 'react-i18next'
import ProfilePictureModal from './ProfilePictureModal'

interface Props {
  userId?: string
}

export default function UserProfile({ userId }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const { user: currentUser, refreshUser } = useUser()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ displayName: '', bio: '' })
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<'profile' | 'followers' | 'following'>('profile')
  const [followers, setFollowers] = useState<User[]>([])
  const [following, setFollowing] = useState<User[]>([])
  const [isProfilePictureModalOpen, setIsProfilePictureModalOpen] = useState(false)

  const isSelf = user?._id === currentUser?._id

  const fetchData = async () => {
    try {
      const userRes = userId
        ? await api.get(`/users/getById/${userId}`)
        : await api.get('/profile/me')
      
      if (!userId) {
        await refreshUser()
        setUser(currentUser)
      } else {
        setUser(userRes.data)
      }
      
      setFormData({
        displayName: userRes.data.displayName || userRes.data.username || '',
        bio: userRes.data.bio || '',
      })
    } catch (err) {
      setError('Erreur lors du chargement du profil')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [userId, currentUser])

  const handleFollow = async () => {
    if (!user || !currentUser) return
    
    try {
      await api.post(`/users/${user._id}/follow`)
      await fetchData()
      await refreshUser()
    } catch (err) {
      console.error('Erreur lors du suivi:', err)
    }
  }

  const handleUnfollow = async () => {
    if (!user || !currentUser) return
    
    try {
      await api.delete(`/users/${user._id}/unfollow`)
      await fetchData()
      await refreshUser()
    } catch (err) {
      console.error('Erreur lors du désabonnement:', err)
    }
  }

  const handleSave = async () => {
    try {
      await api.put('/profile/me', formData)
      await refreshUser()
      setIsEditing(false)
      await fetchData()
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
    }
  }, [state.loading, state.user, userId, id]);

  const handleUpdateProfilePicture = async (imageData: string, contentType: string) => {
    try {
      await api.post('/profile/me/avatar', {
        image: imageData,
        contentType: contentType
      })
      
      await refreshUser()
      await fetchData()
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la photo:', err)
      throw err
    }
  }

  const handleRemoveProfilePicture = async () => {
    try {
      await api.delete('/profile/me/avatar')
      
      await refreshUser()
      await fetchData()
    } catch (err) {
      console.error('Erreur lors de la suppression de la photo:', err)
      throw err
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-lg text-red-500">{error || t('profile.user_not_found')}</div>
      </div>
    )
  }

  const isFollowing = currentUser?.following?.some(f => 
    typeof f === 'string' ? f === user._id : f._id === user._id
  )

  if (viewMode === 'followers' || viewMode === 'following') {
    const list = viewMode === 'followers' ? (user.followers || []) : (user.following || [])
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-10 px-2">
        <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700/50 mb-8">
          <div className="flex items-center gap-6 mb-6">
            <button onClick={() => setViewMode('profile')} className="text-2xl text-blue-600 hover:text-blue-800">
              <MdArrowBack />
            </button>
            <div className="flex gap-4 border-b w-full justify-center text-sm font-medium">
              <button
                onClick={() => setViewMode('followers')}
                className={`px-4 py-2 ${viewMode === 'followers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
              >
                Abonné{(user.followers?.length ?? 0) > 1 ? 's' : ''} ({user.followers?.length ?? 0})
              </button>
              <button
                onClick={() => setViewMode('following')}
                className={`px-4 py-2 ${viewMode === 'following' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
              >
                Abonnement{(user.following?.length ?? 0) > 1 ? 's' : ''} ({user.following?.length ?? 0})
              </button>
            </div>
          </div>

          <div className="space-y-3 mt-6">
            {list.length === 0 ? (
              <p className="text-gray-500">{t("profile.no_results")}</p>
            ) : (
              list.map((u: any) => (
                <div key={u._id} className="flex items-center gap-3">
                  <img src={u.profilePicture || '/default-avatar.png'} className="w-9 h-9 rounded-full" />
                  <Link href={`/profile/${u._id}`} className="hover:underline">@{u.username}</Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-10 px-2">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 flex flex-col md:flex-row items-start gap-8 mb-8 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col items-center md:flex-row md:items-start md:gap-8 w-full">
          {/* Photo de profil avec bouton d'édition */}
          <div className="relative group">
            <img
              src={user.profilePicture || '/default-avatar.png'}
              alt="avatar"
              className="w-32 h-32 rounded-full object-cover border-4 border-blue-300 dark:border-blue-700 shadow-xl mx-auto md:mx-0"
            />
            {isSelf && (
              <button
                onClick={() => setIsProfilePictureModalOpen(true)}
                className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <MdEdit className="text-white text-xl" />
              </button>
            )}
          </div>
          
          <div className="text-center md:text-left flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom d'affichage
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom d'affichage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Bio"
                    rows={3}
                    maxLength={160}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.bio.length}/160 caractères
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    Sauvegarder
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {user.displayName || user.username}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-3">@{user.username}</p>
                {user.bio && (
                  <p className="text-gray-700 dark:text-gray-200 mb-6 max-w-md leading-relaxed">{user.bio}</p>
                )}
                
                <div className="flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-400 mb-6">
                  <button 
                    onClick={() => setViewMode('followers')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span className="font-bold text-lg text-gray-900 dark:text-white">{user.followers?.length || 0}</span>
                    <span className="ml-1">Abonné{(user.followers?.length ?? 0) > 1 ? 's' : ''}</span>
                  </button>
                  <button 
                    onClick={() => setViewMode('following')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span className="font-bold text-lg text-gray-900 dark:text-white">{user.following?.length || 0}</span>
                    <span className="ml-1">Abonnement{(user.following?.length ?? 0) > 1 ? 's' : ''}</span>
                  </button>
                  <span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">{user.posts?.length || 0}</span>
                    <span className="ml-1">Post{(user.posts?.length ?? 0) > 1 ? 's' : ''}</span>
                  </span>
                </div>

                {isSelf ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-8 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-medium shadow-lg"
                  >
                    {t('profile.edit_profile')}
                  </button>
                ) : (
                  <button
                    onClick={isFollowing ? handleUnfollow : handleFollow}
                    className={`px-8 py-3 rounded-full transition-colors font-medium shadow-lg ${
                      isFollowing
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isFollowing ? t('profile.unfollow') : t('profile.follow')}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl">
        <PostList fetchUrl={`/api/posts/user/${user._id}`} />
      </div>

      {/* Modal pour changer la photo de profil */}
      <ProfilePictureModal
        isOpen={isProfilePictureModalOpen}
        onClose={() => setIsProfilePictureModalOpen(false)}
        currentProfilePicture={user.profilePicture}
        onUpload={handleUpdateProfilePicture}
        onRemove={handleRemoveProfilePicture}
      />
    </div>
  )
}
