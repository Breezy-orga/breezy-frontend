// 'use client' obligatoire pour Next.js app directory
'use client';

import { useEffect, useState } from 'react'
import api from '@/lib/axios'
import { User } from '@/types/models'
import PostList from './PostList'
import Link from 'next/link'
import { MdArrowBack } from 'react-icons/md'

interface UserProfileProps {
  userId?: string;
}

interface UserProfileState {
  user: User | null;
  posts: Post[];
  followers: User[];
  following: User[];
  isSelf: boolean;
  isFollowing: boolean;
  editMode: boolean;
  saving: boolean;
  error: string | null;
  loading: boolean;
  profilePicture: string;
  bannerImage: string;
  bannerPreview: string;
  pseudonym: string;
  bio: string;
}

  const [viewMode, setViewMode] = useState<'profile' | 'followers' | 'following'>('profile')
  const [followers, setFollowers] = useState<User[]>([])
  const [following, setFollowing] = useState<User[]>([])

  const [state, setState] = useState<UserProfileState>({
    user: null,
    posts: [],
    followers: [],
    following: [],
    isSelf: false,
    isFollowing: false,
    editMode: false,
    saving: false,
    error: null,
    loading: true,
    profilePicture: '',
    bannerImage: '',
    bannerPreview: '',
    pseudonym: '',
    bio: '',
  });

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
      let user: User | null = null;

      if ((profileId === 'self' || (state.user && profileId === state.user._id)) && state.user) {
        console.log('[UserProfile] Chargement du profil utilisateur connecté');
        user = state.user;
      } else {
        console.log(`[UserProfile] Appel API pour récupérer l'utilisateur avec l'ID: ${profileId}`);
        const userRes = await userApi.getUser(profileId);
        console.log('[UserProfile] Réponse de userApi.getUser:', userRes);
        user = 'user' in userRes ? userRes.user : userRes;
      }

      if (!user) {
        console.error('[UserProfile] Utilisateur non trouvé');
        throw new Error('Utilisateur introuvable');
      }

      console.log(`[UserProfile] Utilisateur chargé:`, {
        id: user._id,
        username: user.username,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
      });

      const [postsRes, followersRes, followingRes] = await Promise.all([
        postApi.getUserPosts(user._id).catch(e => {
          console.error('[UserProfile] Erreur lors du chargement des posts:', e);
          return [];
        }),
        userApi.getFollowers(user._id).catch(e => {
          console.error('[UserProfile] Erreur lors du chargement des followers:', e);
          return { followers: [] };
        }),
        userApi.getFollowing(user._id).catch(e => {
          console.error('[UserProfile] Erreur lors du chargement des abonnements:', e);
          return { following: [] };
        }),
      ]);

      const posts: Post[] = Array.isArray(postsRes) ? postsRes : (postsRes?.posts || []);
      const followers: User[] = followersRes?.followers || [];
      const following: User[] = followingRes?.following || [];
      const isSelf = !!(state.user && user._id === state.user._id);
      const isFollowing = !!(state.user && user.followers && user.followers.includes(state.user._id));

      console.log('[UserProfile] Données chargées:', {
        posts: posts.length,
        followers: followers.length,
        following: following.length,
        isSelf,
        isFollowing,
      });

      setState(prevState => ({
        ...prevState,
        user,
        posts,
        followers,
        following,
        isSelf,
        isFollowing,
        profilePicture: user.profilePicture || '',
        bannerImage: user.bannerImage || '',
        bannerPreview: '',
        pseudonym: user.pseudonym || user.username || '',
        bio: user.bio || '',
        editMode: false,
        saving: false,
        loading: false,
        error: null,
      }));

      console.log('[UserProfile] État mis à jour avec succès');
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || 'Erreur inconnue';
      console.error('[UserProfile] Erreur lors du chargement du profil:', e);
      console.error('[UserProfile] Détails de l\'erreur:', {
        message: e.message,
        status: e.response?.status,
        data: e.response?.data,
        stack: e.stack,
      });

      setState(s => ({ ...s, error: errorMessage, loading: false }));
    }
  };

  useEffect(() => {
    if (!state.loading && state.user) {
      const profileId = userId || id || state.user._id;
      loadProfile(profileId);
    }
  }, [state.loading, state.user, userId, id]);

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

  if (state.error) {
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
              Abonné{(user.followers?.length ?? 0) > 1 ? 's' : ''} ({user.followers?.length ?? 0})
            </button>
            <button
              onClick={() => setViewMode('following')}
              className={`px-4 py-2 ${viewMode === 'following' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
            <>
              <h2 className="text-xl font-semibold">@{user.username}</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {user.bio || 'Aucune biographie renseignée.'}
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Membre depuis le {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'date inconnue'}
              </div>

              <div className="mt-2 text-sm space-x-4">
                <button
                  onClick={() => setViewMode('followers')}
                  className="hover:underline text-black dark:text-white"
                >
                  <strong>{user.followers?.length ?? 0}</strong> abonné{(user.followers?.length ?? 0) > 1 ? 's' : ''}
                </button>
                <span>·</span>
                <button
                  className="hover:underline text-black dark:text-white"
                >
                  <strong>{user.following?.length ?? 0}</strong> abonnement{(user.following?.length ?? 0) > 1 ? 's' : ''}
                </button>
              </div>

              {isSelf && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Modifier mon profil
                </button>
              )}

              {!isSelf && (
                <button
                  onClick={handleFollowToggle}
                  className={`mt-4 inline-block px-4 py-2 rounded-lg transition font-semibold ${
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
            </>
          )}
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
              className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
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
              className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
            >
              Supprimer ce compte
            </button>
          ) : null}
        </div>
      </nav>
      <section className="max-w-3xl mx-auto mt-6 px-4 md:px-0">
        <p className="italic text-gray-700 dark:text-fuchsia-100/80 text-lg mb-2 text-center">
          {state.bio || state.user?.bio || 'Cet utilisateur n’a pas encore renseigné de bio.'}
        </p>
      </section>
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Posts</h2>
        <PostList initialPosts={state.posts} tab="all" userId={state.user?._id || ''} />
      </div>

      <h2 className="text-xl font-bold mb-4">Publications</h2>
      <PostList fetchUrl={`/api/posts/user/${user._id}`} />
    </div>
  );
};

export default UserProfile;