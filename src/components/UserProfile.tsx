// 'use client' obligatoire pour Next.js app directory
'use client';

import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '@/context/CurrentUserContext';
import { useParams } from 'next/navigation';
import { User, Post } from '@/types/models';
import PostList from './PostList';
import { userApi, postApi, uploadApi } from '@/lib/api';
import { Loader2 as LoaderIcon, UserCircle as UserCircleIcon } from 'lucide-react';

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

const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const { id } = useParams<{ id: string }>();

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

  const loadProfile = async (profileId: string) => {
    console.log(`[UserProfile] Chargement du profil pour l'ID: ${profileId}`);
    setState(s => ({ ...s, loading: true, error: null }));

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
    if (!state.user) return;
    console.log('[handleFollowToggle] Début - isFollowing:', state.isFollowing);
    setState(s => ({ ...s, saving: true, error: null }));

    try {
      console.log('[handleFollowToggle] Appel à toggleFollow pour l\'utilisateur:', state.user._id);
      const response = await userApi.toggleFollow(state.user._id);
      console.log('[handleFollowToggle] Réponse de toggleFollow:', response);

      setState(s => ({
        ...s,
        isFollowing: response.following,
        saving: false,
      }));

      console.log('[handleFollowToggle] Suivi mis à jour avec succès. Nouvel état:', response.following);

      await loadProfile(state.user._id);
      console.log('[handleFollowToggle] Profil rechargé avec succès');
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || 'Erreur lors du suivi';
      console.error('[handleFollowToggle] Erreur:', errorMessage, e);
      setState(s => ({ ...s, error: errorMessage, saving: false }));
    }
  };

  const handleSave = async () => {
    if (!state.user) return;
    setState(s => ({ ...s, saving: true, error: null }));
    try {
      const payload: any = {
        profilePicture: state.profilePicture || state.user.profilePicture || '',
        bannerImage: state.bannerImage || state.user.bannerImage || '',
        pseudonym: state.pseudonym,
        bio: state.bio,
      };

      const response = await userApi.updateMe(payload);
      await loadProfile(state.user._id);
      setState(s => ({
        ...s,
        editMode: false,
        bannerPreview: '',
        saving: false,
        error: null,
      }));
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Une erreur est survenue lors de la sauvegarde du profil';
      setState(s => ({
        ...s,
        error: errorMessage,
        saving: false,
      }));
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setState(s => ({ ...s, profilePicture: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setState(s => ({ ...s, bannerPreview: reader.result as string, bannerImage: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  if (state.loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <LoaderIcon className="animate-spin h-12 w-12 text-blue-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Chargement du profil...</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="p-6 text-center text-red-600 dark:text-red-400">
        <span className="font-bold text-lg">Erreur :</span> {state.error}
      </div>
    );
  }

  if (!state.user) {
    return <div className="p-6 text-center text-gray-600 dark:text-gray-400">Chargement du profil utilisateur...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <header className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 pt-20 mt-[-4rem] flex flex-col items-center text-center border border-gray-100 dark:border-gray-700">
        <div className="relative rounded-xl overflow-hidden h-36 sm:h-40 md:h-48 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 shadow">
          {state.bannerImage && (
            <img
              src={state.bannerImage}
              alt="Bannière"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {state.isSelf && state.editMode && (
            <label className="absolute top-4 right-8 bg-white/90 rounded-full p-2 cursor-pointer shadow-lg hover:bg-fuchsia-100 transition border border-fuchsia-300 z-30">
              <svg className="w-6 h-6 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
            </label>
          )}
        </div>
        <div className="absolute left-1/2 -bottom-16 transform -translate-x-1/2 z-20">
          <img
            src={state.profilePicture || '/default-avatar.png'}
            alt="Avatar"
            className="w-36 h-36 rounded-full border-4 border-white shadow-xl object-cover bg-white dark:border-gray-900 dark:bg-gray-900"
            style={{ boxShadow: '0 4px 32px 0 rgba(0,0,0,0.10)' }}
          />
          {state.isSelf && state.editMode && (
            <label className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 cursor-pointer shadow-lg hover:bg-fuchsia-100 transition border border-fuchsia-300 z-30">
              <svg className="w-6 h-6 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          )}
        </div>
        <div className="flex flex-col items-center gap-2 mb-2">
          <span className="font-bold text-2xl md:text-3xl text-gray-900 dark:text-white">{state.user.pseudonym}</span>
          <span className="text-blue-500 font-mono text-lg">@{state.user.username}</span>
          {state.user.bio && <span className="text-gray-500 dark:text-gray-300 text-base mt-1">{state.user.bio}</span>}
        </div>
        <button
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-pink-500 text-white font-semibold px-6 py-2 rounded-lg shadow mt-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-300"
          onClick={() => setState(s => ({ ...s, editMode: !s.editMode }))}
        >
          {state.editMode ? 'Annuler' : 'Éditer'}
        </button>
        <div className="flex justify-center gap-8 mt-6 mb-2">
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-gray-900 dark:text-white">{state.posts.length}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Posts</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-gray-900 dark:text-white">{state.followers.length}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Abonnés</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-gray-900 dark:text-white">{state.following.length}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Abonnements</span>
          </div>
        </div>
      </header>
      <nav className="sticky top-0 z-30 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-fuchsia-900/20 flex flex-row items-center gap-8 px-4 md:px-16 py-3 shadow-sm">
        <div className="flex gap-6 md:gap-12">
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-blue-700 dark:text-fuchsia-100">{state.posts.length}</span>
            <span className="text-xs text-gray-700 dark:text-fuchsia-100 uppercase">Posts</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-fuchsia-700 dark:text-fuchsia-200">{state.user?.followers?.length ?? 0}</span>
            <span className="text-xs text-gray-700 dark:text-fuchsia-100 uppercase">Abonnés</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-pink-700 dark:text-fuchsia-200">{state.user?.following?.length ?? 0}</span>
            <span className="text-xs text-gray-700 dark:text-fuchsia-100 uppercase">Abonnements</span>
          </div>
        </div>
        <div className="flex gap-4 ml-auto">
          <button className="px-4 py-2 rounded-lg text-sm font-semibold text-fuchsia-600 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 transition">Posts</button>
          <button className="px-4 py-2 rounded-lg text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">Likes</button>
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
    </div>
  );
};

export default UserProfile;