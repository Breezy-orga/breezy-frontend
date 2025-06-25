'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/axios'
import { User } from '@/lib/models/User'
import PostList from './PostList'
import Link from 'next/link'
import { MdArrowBack } from 'react-icons/md'
import { useTranslation } from 'react-i18next'

interface Props {
  userId?: string
}

export default function UserProfile({ userId }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ username: '', bio: '' })
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<'profile' | 'followers' | 'following'>('profile')
  
  const [followers, setFollowers] = useState<User[]>([])
  const [following, setFollowing] = useState<User[]>([])

  const isSelf = user?._id === currentUser?._id

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, meRes] = await Promise.all([
          api.get(`/users/${userId || 'me'}`),
          api.get('/users/me')
        ])
        setUser(userRes.data)
        setCurrentUser(meRes.data)
        setFormData({
          username: userRes.data.username || '',
          bio: userRes.data.bio || ''
        })
      } catch (err) {
        setError('Erreur lors du chargement du profil')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  useEffect(() => {
    const fetchList = async () => {
      try {
        if (viewMode === 'followers') {
          const res = await api.get(`/users/${userId || 'me'}/followers`)
          setFollowers(res.data)
        } else if (viewMode === 'following') {
          const res = await api.get(`/users/${userId || 'me'}/following`)
          setFollowing(res.data)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des abonnés/abonnements :", error)
      }
    }

    if (viewMode !== 'profile') fetchList()
  }, [viewMode, userId])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.put('/users/me', formData)
      setUser(res.data)
      setIsEditing(false)
    } catch {
      alert('Erreur lors de la mise à jour du profil')
    }
  }

  const handleFollowToggle = async () => {
    if (!user) return
      try {
        await api.post(`/users/${user._id}/follow`)
        // Rafraîchir le user connecté et la cible
        const [userRes, meRes] = await Promise.all([
          api.get(`/users/${userId || 'me'}`),
          api.get('/users/me'),
        ])
        setUser(userRes.data)
        setCurrentUser(meRes.data)
      } catch (error) {
        console.error("Erreur lors du (un)follow :", error)
      }
  }



  if (loading) return <div className="text-center p-4">{t("profile.loading")}</div>
  if (error) return <div className="text-center p-4 text-red-500">{t("profile.error_loading")}</div>
  if (!user) return <div className="text-center p-4">{t("profile.not_found")}</div>

  // ----------------------------
  // AFFICHAGE DES FOLLOWERS/FOLLOWING
  // ----------------------------
  if (viewMode !== 'profile') {
    const list = viewMode === 'followers' ? followers : following

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex items-center mb-4">
          <button onClick={() => setViewMode('profile')} className="text-2xl text-blue-600 hover:text-blue-800">
            <MdArrowBack />
          </button>
          <div className="ml-4 flex gap-4 border-b w-full justify-center text-sm font-medium">
            <button
              onClick={() => setViewMode('followers')}
              className={`px-4 py-2 ${viewMode === 'followers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
              {t("profile.followers", { count: user.followers.length })}
            </button>
            <button
              onClick={() => setViewMode('following')}
              className={`px-4 py-2 ${viewMode === 'following' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
              {t("profile.following", { count: user.following.length })}
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
    )
  }

  // ----------------------------
  // AFFICHAGE PROFIL NORMAL
  // ----------------------------
  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col md:flex-row items-start gap-6 mb-8">
        <img
          src={user.profilePicture || '/default-avatar.png'}
          alt={user.username}
          className="w-24 h-24 rounded-full object-cover border border-gray-300"
        />
        <div className="w-full">
          {isEditing && isSelf ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder={t("profile.username_placeholder")}
              />
              <textarea
                value={formData.bio} 
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder={t("profile.bio_placeholder")}
              />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t("profile.save")}</button>
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">{t("profile.cancel")}</button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="text-xl font-semibold">@{user.username}</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">{user.bio || t("profile.no_bio")}</p>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
               {t("profile.member_since", { date: new Date(user.createdAt).toLocaleDateString() })}
              </div>

              <div className="mt-2 text-sm space-x-4">
                <button
                  onClick={() => setViewMode('followers')}
                  className="hover:underline text-black dark:text-white"
                >
                   <strong>{user.followers.length}</strong> {t("profile.followers_short", { count: user.followers.length })}
                </button>
                <span>·</span>
                <button
                  onClick={() => setViewMode('following')}
                  className="hover:underline text-black dark:text-white"
                >
                  <strong>{user.following.length}</strong> {t("profile.following_short", { count: user.following.length })} 
                </button>
              </div>

              {isSelf && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {t("profile.edit")}
                </button>
              )}

              {!isSelf && (
                <button
                  onClick={handleFollowToggle}
                  className={`mt-4 inline-block px-4 py-2 rounded-lg transition font-semibold ${
                    currentUser?.following.includes(user._id)
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {currentUser?.following.includes(user._id) ? t('profile.unfollow') : t('profile.follow')}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">{t("profile.posts")}</h2>
      <PostList fetchUrl={`${process.env.NEXT_PUBLIC_API_URL}/posts/user/${user._id}`} />
    </div>
  )
}