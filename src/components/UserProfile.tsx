'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/axios'
import { User } from '@/types/models'
import PostList from './PostList'
import Link from 'next/link'
import { MdArrowBack } from 'react-icons/md'

interface Props {
  userId?: string
}

export default function UserProfile({ userId }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ displayName: '', bio: '', profilePicture: '' })

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
          displayName: userRes.data.displayName || userRes.data.username || '',
          bio: userRes.data.bio || '',
          profilePicture: userRes.data.profilePicture || ''
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
        const targetId = userId || 'me'
        if (viewMode === 'followers') {
          const res = await api.get(`/users/getById/${targetId}/followers`)
          setFollowers(res.data)
        } else if (viewMode === 'following') {
          const res = await api.get(`/users/getById/${targetId}/following`)
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
      const data = new FormData();
      data.append('displayName', formData.displayName);
      data.append('bio', formData.bio);
      if (formData.profilePicture && formData.profilePicture.startsWith('data:')) {
        data.append('profilePicture', formData.profilePicture);
      }
      const res = await api.put('/users/me', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUser(res.data);
      setIsEditing(false);
    } catch {
      alert('Erreur lors de la mise à jour du profil');
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


  if (loading) return <div className="text-center p-4">Chargement...</div>
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>
  if (!user) return <div className="text-center p-4">Utilisateur introuvable</div>

  // ----------------------------
  // AFFICHAGE DES FOLLOWERS/FOLLOWING
  // ----------------------------
  if (viewMode !== 'profile') {
    const list = viewMode === 'followers' ? followers : following

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
              <p className="text-gray-500">Aucun résultat.</p>
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

  // ----------------------------
  // AFFICHAGE PROFIL NORMAL
  // ----------------------------
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-10 px-2">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col md:flex-row items-start gap-6 mb-8">
        <div className="flex flex-col items-center md:flex-row md:items-center md:gap-8">
          <img
            src={user.profilePicture || '/default-avatar.png'}
            alt="avatar"
            className="w-28 h-28 rounded-full object-cover border-4 border-blue-300 dark:border-blue-700 shadow-xl mx-auto md:mx-0"
          />
          <div className="flex-1 mt-6 md:mt-0 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">@{user.username}</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2 italic">
              {user.bio || 'Aucune biographie renseignée.'}
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Membre depuis le {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'date inconnue'}
            </div>

            <div className="mt-3 flex justify-center md:justify-start gap-4 text-sm">
              <button
                onClick={() => setViewMode('followers')}
                className="hover:underline font-medium text-blue-700 dark:text-blue-300"
              >
                <strong>{user.followers?.length ?? 0}</strong> abonné{(user.followers?.length ?? 0) > 1 ? 's' : ''}
              </button>
              <span className="text-gray-400">·</span>
              <button
                onClick={() => setViewMode('following')}
                className="hover:underline font-medium text-blue-700 dark:text-blue-300"
              >
                <strong>{user.following?.length ?? 0}</strong> abonnement{(user.following?.length ?? 0) > 1 ? 's' : ''}
              </button>
            </div>

            {isSelf && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-5 px-5 py-2 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition"
              >
                Modifier mon profil
              </button>
            )}

            {isSelf && isEditing && (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-blue-100 dark:border-blue-700/30 w-full max-w-md mx-auto animate-fade-in">
      <button
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
        onClick={() => setIsEditing(false)}
        aria-label="Fermer"
      >
        ×
      </button>
      <form onSubmit={handleUpdate} className="flex flex-col gap-6 p-8">
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <img
              src={formData.profilePicture || user.profilePicture || '/default-avatar.png'}
              alt="avatar preview"
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-400 dark:border-blue-700 shadow-lg mx-auto transition-all duration-200 hover:scale-105"
            />
            <label className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer shadow">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = ev => {
                      setFormData(f => ({ ...f, profilePicture: ev.target?.result as string }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <span className="text-xs">📷</span>
            </label>
          </div>
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">Pseudonyme</label>
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base"
            value={formData.displayName}
            maxLength={32}
            onChange={e => setFormData(f => ({ ...f, displayName: e.target.value }))}
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">Bio</label>
          <textarea
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base min-h-[60px]"
            value={formData.bio}
            onChange={e => setFormData(f => ({ ...f, bio: e.target.value }))}
            rows={3}
            maxLength={180}
            placeholder="Décris-toi en quelques mots..."
          />
        </div>
        <div className="flex gap-4 justify-end mt-2">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 shadow"
            onClick={() => setIsEditing(false)}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
          >
            Sauvegarder
          </button>
        </div>
      </form>
    </div>
  </div>
)}

            {!isSelf && (
              <button
                onClick={handleFollowToggle}
                className={`mt-5 px-5 py-2 rounded-full font-semibold shadow transition ${
                  (currentUser?.following ?? []).includes(user._id)
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {(currentUser?.following ?? []).includes(user._id)
                  ? 'Se désabonner'
                  : 'Suivre'}
              </button>
            )}
          </div>
        </div>
        {(currentUser?.role === 'admin' && !isSelf) && (
          <button
            onClick={async () => {
              // À remplacer par ta future route d'API
              try {
                const newRole = user.role === 'moderator' ? 'user' : 'moderator';
                // await api.put(`/users/${user._id}/role`, { role: newRole });
                alert(`(Démo) Le rôle passera à : ${newRole}`);
              } catch (err) {
                alert("Erreur lors du changement de rôle.");
              }
            }}
            className="mt-5 px-5 py-2 bg-green-600 text-white rounded-full font-semibold shadow hover:bg-green-700 transition"
          >
            {user.role === 'moderator' ? 'Rétrograder en utilisateur' : 'Promouvoir en modérateur'}
          </button>
        )}
        {(currentUser?.role === 'admin' && !isSelf) || currentUser?.role != 'admin' && isSelf ? (
          <button
            onClick={async () => {
              if (confirm("Supprimer ce compte ? Cette action est irréversible.")) {
                try {
                  await api.delete(`/users/${user._id}`);
                  alert("Compte supprimé !");
                  window.location.href = "/";
                } catch (err) {
                  alert("Erreur lors de la suppression du compte.");
                }
              }
            }}
            className="mt-5 px-5 py-2 bg-red-600 text-white rounded-full font-semibold shadow hover:bg-red-700 transition"
          >
            Supprimer ce compte
          </button>
        ) : null}
      </div>

      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white text-center">Publications</h2>
      <div className="w-full max-w-xl">
        <PostList fetchUrl={`/api/posts/user/${user._id}`} />
      </div>
    </div>
  )
}