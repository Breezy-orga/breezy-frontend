'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/axios'
import { User } from '@/types/models'
import PostList from './PostList'
import Link from 'next/link'
import { MdArrowBack } from 'react-icons/md'
import { useTranslation } from 'react-i18next'
import { formatRelativeDate } from '../i18n/formatRelativeDate'

interface Props {
  userId?: string
}

export default function UserProfile({ userId }: Props) {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ username: '', bio: '' })

  const [viewMode, setViewMode] = useState<'profile' | 'followers' | 'following'>('profile')
  const [followers, setFollowers] = useState<User[]>([])
  const [following, setFollowing] = useState<User[]>([])

  const isSelf = user?._id === currentUser?._id

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = userId
          ? await api.get(`/users/getById/${userId}`)
          : await api.get('/users/me')
        const meRes = await api.get('/users/me')
        setUser(userRes.data)
        setCurrentUser(meRes.data)
        setFormData({
          username: userRes.data.username || '',
          bio: userRes.data.bio || ''
        })
      } catch (err) {
        setError(t('profile.load_error'))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [userId, t])

  useEffect(() => {
    const fetchList = async () => {
      try {
        const targetId = userId || currentUser?._id
        if (viewMode === 'followers') {
          const res = await api.get(`/follow/${targetId}/followers`)
          setFollowers(res.data)
        } else if (viewMode === 'following') {
          const res = await api.get(`/follow/${targetId}/following`)
          setFollowing(res.data)
        }
      } catch (error) {
        console.error(t('profile.follow_error'), error)
      }
    }
    if (viewMode !== 'profile') fetchList()
  }, [viewMode, userId, currentUser, t])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.put('/users/me', formData)
      setUser(res.data)
      setIsEditing(false)
    } catch {
      alert(t('profile.update_error'))
    }
  }

  const handleFollowToggle = async () => {
    if (!user) return
    try {
      await api.post(`/users/${user._id}/follow`)
      // Rafraîchir le user connecté et la cible
      const userRes = userId
        ? await api.get(`/users/getById/${userId}`)
        : await api.get('/users/me')
      const meRes = await api.get('/users/me')
      setUser(userRes.data)
      setCurrentUser(meRes.data)
    } catch (error) {
      console.error("Erreur lors du (un)follow :", error)
    }
  }

  // Force re-render quand la langue change (pour que la date suive le provider)
  const [lang, setLang] = useState('');
  useEffect(() => {
    const updateLang = () => {
      const lsLang = typeof window !== 'undefined' ? window.localStorage.getItem('i18nextLng') : '';
      setLang(lsLang || i18n.language);
    };
    updateLang();
    i18n.on('languageChanged', updateLang);
    return () => { i18n.off('languageChanged', updateLang); };
  }, [i18n]);

  // Formatage date d'inscription (UserProfile)
  const formatProfileDate = (dateString: string) => formatRelativeDate(dateString, t);

  if (loading) return <div className="text-center p-4">{t('profile.loading')}</div>
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>
  if (!user) return <div className="text-center p-4">{t('profile.not_found')}</div>

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
              {t('profile.followers', { count: user.followers?.length ?? 0 })}
            </button>
            <button
              onClick={() => setViewMode('following')}
              className={`px-4 py-2 ${viewMode === 'following' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
              {t('profile.following', { count: user.following?.length ?? 0 })}
            </button>
          </div>
        </div>
        <div className="space-y-3 mt-6">
          {list.length === 0 ? (
            <p className="text-gray-500">{t('profile.no_results')}</p>
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
                placeholder={t('profile.username_placeholder')}
              />
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder={t('profile.bio_placeholder')}
              />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {t('profile.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                >
                  {t('profile.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="text-xl font-semibold">@{user.username}</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {user.bio || t('profile.no_bio')}
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {t('profile.member_since', { date: user.createdAt ? formatProfileDate(user.createdAt) : t('profile.unknown_date') })}
              </div>
              <div className="mt-2 text-sm space-x-4">
                <button
                  onClick={() => setViewMode('followers')}
                  className="hover:underline text-black dark:text-white"
                >
                  <strong>{user.followers?.length ?? 0}</strong> {t('profile.followers_short', { count: user.followers?.length ?? 0 })}
                </button>
                <span>·</span>
                <button
                  onClick={() => setViewMode('following')}
                  className="hover:underline text-black dark:text-white"
                >
                  <strong>{user.following?.length ?? 0}</strong> {t('profile.following_short', { count: user.following?.length ?? 0 })}
                </button>
              </div>
              {isSelf && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  style={{ backgroundColor: "#2563eb", color: "#fff" }}
                >
                  {t('profile.edit_profile')}
                </button>
              )}
              {!isSelf && (
                <button
                  onClick={handleFollowToggle}
                  className="mt-4 inline-block px-4 py-2 rounded-lg transition font-semibold"
                  style={
                    (currentUser?.following ?? []).includes(user._id)
                      ? { backgroundColor: "#fee2e2", color: "#dc2626" } // rouge-100 bg, rouge-600 texte
                      : { backgroundColor: "#2563eb", color: "#fff" }    // bleu-600 bg, blanc texte
                  }
                  onMouseOver={e => {
                    if ((currentUser?.following ?? []).includes(user._id)) {
                      e.currentTarget.style.backgroundColor = "#fecaca"; // rouge-200
                    } else {
                      e.currentTarget.style.backgroundColor = "#1d4ed8"; // bleu-700
                    }
                  }}
                  onMouseOut={e => {
                    if ((currentUser?.following ?? []).includes(user._id)) {
                      e.currentTarget.style.backgroundColor = "#fee2e2";
                    } else {
                      e.currentTarget.style.backgroundColor = "#2563eb";
                    }
                  }}
                >
                  {(currentUser?.following ?? []).includes(user._id)
                    ? t('profile.unfollow')
                    : t('profile.follow')}
                </button>
              )}
            </>
          )}
          {(currentUser?.role === 'admin' && !isSelf) && (
            <button
              onClick={async () => {
                try {
                  const newRole = user.role === 'moderator' ? 'user' : 'moderator';
                  // await api.put(`/users/${user._id}/role`, { role: newRole });
                  alert(t('profile.role_demo', { role: newRole }))
                } catch (err) {
                  alert(t('profile.role_error'))
                }
              }}
              className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              {user.role === 'moderator' ? t('profile.demote') : t('profile.promote')}
            </button>
          )}
          {(currentUser?.role === 'admin' && !isSelf) || currentUser?.role != 'admin' && isSelf ? (
            <button
              onClick={async () => {
                if (confirm(t('profile.delete_confirm'))) {
                  try {
                    await api.delete(`/users/${user._id}`);
                    alert(t('profile.delete_success'));
                    window.location.href = "/";
                  } catch (err) {
                    alert(t('profile.delete_error'));
                  }
                }
              }}
              className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
              style={{ backgroundColor: "#dc2626", color: "#fff" }} // rouge Tailwind 600
          >
              {t('profile.delete_account')}
            </button>
          ) : null}
        </div>
      </div>
      <h2 className="text-xl font-bold mb-4">{t('profile.posts')}</h2>
      <PostList fetchUrl={`/api/posts/user/${user._id}`} />
    </div>
  )
}