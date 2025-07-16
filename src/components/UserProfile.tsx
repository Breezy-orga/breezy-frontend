'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/axios'
import { User } from '@/types/models'
import PostList from './PostList'
import Link from 'next/link'
import { MdArrowBack, MdEdit, MdCamera, MdFlag, MdWarning, MdBlock, MdInfo } from 'react-icons/md'
import { useTranslation } from 'react-i18next'
import { formatRelativeDate } from '../i18n/formatRelativeDate'
import { ProfileSync } from '@/utils/profileSync'
import ReportModal from './ReportModal'
import { UserStatusBadge, UserStatusBanner } from './UserStatusAlert'

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
  const [formData, setFormData] = useState({ 
    name: '',
    bio: '' 
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
    visible: boolean;
  } | null>(null)

  const [viewMode, setViewMode] = useState<'profile' | 'followers' | 'following'>('profile')
  const [followers, setFollowers] = useState<User[]>([])
  const [following, setFollowing] = useState<User[]>([])
  const [showReportModal, setShowReportModal] = useState(false)
  const [statusBannerDismissed, setStatusBannerDismissed] = useState(false)

  const isSelf = user?._id === currentUser?._id

  // Fonction pour afficher une notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type, visible: true })
    setTimeout(() => {
      setNotification(prev => prev ? { ...prev, visible: false } : null)
      setTimeout(() => setNotification(null), 300)
    }, 3000)
  }

  // Fonction pour fermer manuellement la notification
  const closeNotification = () => {
    setNotification(prev => prev ? { ...prev, visible: false } : null)
    setTimeout(() => setNotification(null), 300)
  }

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
          name: userRes.data.name || userRes.data.username || '',
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
        // Gestion d'erreur silencieuse
      }
    }
    if (viewMode !== 'profile') fetchList()
  }, [viewMode, userId, currentUser, t])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        alert(t('profile.invalid_file_type'))
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(t('profile.file_too_large'))
        return
      }

      setSelectedFile(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadProfilePicture = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)
      
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        
        try {
          const response = await api.post('/users/upload-profile-picture', {
            base64: base64,
            contentType: selectedFile.type
          })
          
          if (user) {
            const updatedUser = { ...user, profilePicture: response.data.profilePicture }
            setUser(updatedUser)
            
            if (isSelf) {
              setTimeout(() => {
                ProfileSync.emitUpdate(updatedUser);
                window.dispatchEvent(new CustomEvent('forceUserRefresh'));
              }, 100);
            }

            setSelectedFile(null)
            setPreviewUrl(null)
            
            showNotification(t('profile.photo_updated') || 'Photo mise à jour avec succès', 'success')
          }
        } catch (error) {
          console.error('Erreur upload:', error);
          alert(t('profile.upload_error'))
        } finally {
          setUploading(false)
        }
      }
      reader.readAsDataURL(selectedFile)
    } catch (error) {
      console.error('Erreur générale:', error);
      alert(t('profile.upload_error'))
      setUploading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.put('/users/profile', formData)
      const updatedUser = res.data
      setUser(updatedUser)
      setIsEditing(false)
      
      if (isSelf) {
        ProfileSync.emitUpdate(updatedUser);
      }
      
      showNotification(t('profile.profile_updated') || 'Profil mis à jour avec succès', 'success')
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      showNotification(t('profile.update_error') || 'Erreur lors de la mise à jour', 'error')
    }
  }

  const handleFollowToggle = async () => {
    if (!user) return
    
    try {
      const wasFollowing = (currentUser?.following ?? []).includes(user._id)
      
      console.log('handleFollowToggle démarré:');
      console.log('- User à follow/unfollow:', user._id, '@' + user.username);
      console.log('- Était déjà suivi:', wasFollowing);
      
      const response = await api.post(`/users/${user._id}/follow`)
      console.log('Réponse API follow:', response.data);
      
      const userRes = userId
        ? await api.get(`/users/getById/${userId}`)
        : await api.get('/users/me')
      const meRes = await api.get('/users/me')
      
      setUser(userRes.data)
      setCurrentUser(meRes.data)
      
      if (response.data.action === 'followed') {
        showNotification(
          `Vous suivez maintenant @${user.username}`, 
          'success'
        )
        console.log('👥 Utilisateur suivi avec succès');
      } else if (response.data.action === 'unfollowed') {
        showNotification(
          `Vous ne suivez plus @${user.username}`, 
          'success'
        )
        console.log('Utilisateur non suivi avec succès');
      } else {
        if (!wasFollowing) {
          showNotification(
            `Vous suivez maintenant @${user.username}`, 
            'success'
          )
        } else {
          showNotification(
            `Vous ne suivez plus @${user.username}`, 
            'success'
          )
        }
      }
      
    } catch (error) {
      console.error('Erreur follow/unfollow:', error)
      showNotification(
        'Erreur lors de l\'action', 
        'error'
      )
    }
  }

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

  const formatProfileDate = (dateString: string) => formatRelativeDate(dateString, t);

  // Fonction pour obtenir l'indicateur de restriction d'accès
  const getAccessRestrictionInfo = () => {
    if (!user || !user.status || user.status === 'active') return null;

    const isCurrentUserAdmin = currentUser?.role === 'admin';
    const isCurrentUserModerator = currentUser?.role === 'moderator' || isCurrentUserAdmin;

    return {
      canView: true, // Les profils restent visibles
      canInteract: isSelf || isCurrentUserModerator, // Seul l'utilisateur lui-même ou les modérateurs peuvent interagir
      showWarning: !isSelf && !isCurrentUserModerator,
      restrictionLevel: user.status === 'banned' ? 'high' : 'medium'
    };
  };

  if (loading) return (
    <div className="text-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-500 dark:text-gray-400">{t('profile.loading')}</p>
    </div>
  );
  
  if (error) return (
    <div className="text-center p-8">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {t('common.error', 'Erreur')}
      </h2>
      <p className="text-red-500">{error}</p>
    </div>
  );
  
  if (!user) return (
    <div className="text-center p-8">
      <div className="text-gray-400 text-6xl mb-4">👤</div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {t('profile.not_found', 'Profil non trouvé')}
      </h2>
      <p className="text-gray-500 dark:text-gray-400">
        Ce profil n'existe pas ou a été supprimé.
      </p>
    </div>
  );

  const accessInfo = getAccessRestrictionInfo();

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
              {t('profile.followers_short', { count: user.followers?.length ?? 0 })} ({user.followers?.length ?? 0})
            </button>
            <button
              onClick={() => setViewMode('following')}
              className={`px-4 py-2 ${viewMode === 'following' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
              {t('profile.following_short', { count: user.following?.length ?? 0 })} ({user.following?.length ?? 0})
            </button>
          </div>
        </div>
        <div className="space-y-3 mt-6">
          {list.length === 0 ? (
            <p className="text-gray-500">{t('profile.no_results')}</p>
          ) : (
            list.map((u: any) => (
              <div key={u._id} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <img 
                  src={u.profilePicture || '/default-avatar.png'} 
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0" 
                  alt={`Avatar de ${u.username}`}
                />
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${u._id}`} className="block hover:underline">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {u.name || u.username}
                      </h3>
                      <span className="text-gray-500 dark:text-gray-400 text-sm truncate">
                        @{u.username}
                      </span>
                      <UserStatusBadge 
                        status={u.status || 'active'}
                        suspendedUntil={u.suspendedUntil}
                        size="small"
                      />
                    </div>
                    {u.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 break-words">
                        {u.bio}
                      </p>
                    )}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative space-y-6">
      {/* Notifications */}
      {notification && (
        <div 
          className={`fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-300 transform ${
            notification.visible 
              ? 'translate-x-0 opacity-100' 
              : 'translate-x-full opacity-0'
          }`}
        >
          <div className={`rounded-lg shadow-lg p-4 flex items-center justify-between ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
              }`}>
                {notification.type === 'success' ? '✓' : '✕'}
              </div>
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={closeNotification}
              className="ml-4 transition-colors text-white hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Banner de statut utilisateur */}
      {user.status && user.status !== 'active' && !statusBannerDismissed && accessInfo?.showWarning && (
        <UserStatusBanner
          status={user.status}
          suspendedUntil={user.suspendedUntil}
          suspensionReason={user.suspensionReason}
          onDismiss={() => setStatusBannerDismissed(true)}
          className="mb-6"
        />
      )}

      {/* Carte de profil principal */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col md:flex-row items-start gap-6">
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="relative">
            <img
              src={previewUrl || user.profilePicture || '/default-avatar.png'}
              alt={user.name || user.username}
              className={`w-24 h-24 rounded-full object-cover border-2 ${
                user.status === 'banned' 
                  ? 'border-red-400 dark:border-red-600 grayscale' 
                  : user.status === 'suspended'
                  ? 'border-yellow-400 dark:border-yellow-600 opacity-75'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {/* Indicateur de statut sur l'avatar */}
            {user.status && user.status !== 'active' && (
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs ${
                user.status === 'banned' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-yellow-500 text-white'
              }`}>
                {user.status === 'banned' ? '🚫' : '⏸️'}
              </div>
            )}
          </div>

          {isSelf && isEditing && (
            <div className="mt-3">
              <label className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors shadow-md font-medium text-sm inline-flex items-center gap-2">
                <MdCamera size={16} />
                {t('profile.change_photo') || 'Changer la photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          )}
          {selectedFile && isEditing && (
            <div className="mt-3 flex flex-col gap-2 items-center">
              <button
                onClick={uploadProfilePicture}
                disabled={uploading}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md font-medium"
              >
                {uploading ? t('profile.uploading') : t('profile.save_photo')}
              </button>
              <button
                onClick={() => {
                  setSelectedFile(null)
                  setPreviewUrl(null)
                }}
                className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors shadow-md font-medium"
              >
                {t('profile.cancel')}
              </button>
            </div>
          )}
        </div>

        <div className="w-full">
          {isEditing && isSelf ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('profile.display_name')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400 transition-colors"
                  placeholder={t('profile.display_name_placeholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('profile.username')}</label>
                <input
                  type="text"
                  value={user.username}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-400 cursor-not-allowed"
                  placeholder={t('profile.username_placeholder')}
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">{t('profile.username_readonly')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('profile.bio')}</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400 transition-colors resize-none"
                  placeholder={t('profile.bio_placeholder')}
                  rows={3}
                  maxLength={160}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {formData.bio.length}/160 {t('profile.characters')}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-md"
                >
                  {t('profile.save')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-md"
                >
                  {t('profile.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Informations utilisateur */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.name || user.username}
                  </h2>
                  <UserStatusBadge 
                    status={user.status || 'active'}
                    suspendedUntil={user.suspendedUntil}
                    suspensionReason={user.suspensionReason}
                    size="medium"
                    showDetails={true}
                  />
                </div>
                
                <p className="text-gray-500 dark:text-gray-400 text-sm">@{user.username}</p>
                
                <p className="text-gray-600 dark:text-gray-300">
                  {user.bio || t('profile.no_bio')}
                </p>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('profile.member_since', { date: user.createdAt ? formatProfileDate(user.createdAt) : t('profile.unknown_date') })}
                </div>
                
                <div className="flex items-center text-sm space-x-4">
                  <button
                    onClick={() => setViewMode('followers')}
                    className="hover:underline text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    <strong>{user.followers?.length ?? 0}</strong> {t('profile.followers_short', { count: user.followers?.length ?? 0 })}
                  </button>
                  <span className="text-gray-400">·</span>
                  <button
                    onClick={() => setViewMode('following')}
                    className="hover:underline text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    <strong>{user.following?.length ?? 0}</strong> {t('profile.following_short', { count: user.following?.length ?? 0 })}
                  </button>
                </div>

                {/* Actions utilisateur */}
                <div className="flex flex-wrap gap-3 pt-4">
                  {isSelf && !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-md"
                    >
                      <MdEdit size={16} />
                      {t('profile.edit_profile')}
                    </button>
                  )}

                  {!isSelf &&(
                    <>
                      <button
                        onClick={handleFollowToggle}
                        className="mt-4 inline-block px-6 py-3 rounded-lg transition-all duration-200 font-semibold shadow-md focus:ring-2 focus:ring-offset-2"
                        style={
                          (currentUser?.following ?? []).includes(user._id)
                            ? { backgroundColor: "#fee2e2", color: "#dc2626" }
                            : { backgroundColor: "#2563eb", color: "#fff" }
                        }
                        onMouseOver={e => {
                          if ((currentUser?.following ?? []).includes(user._id)) {
                            e.currentTarget.style.backgroundColor = "#fecaca";
                          } else {
                            e.currentTarget.style.backgroundColor = "#1d4ed8";
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

                      <button
                        onClick={() => setShowReportModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-md"
                        title={t('report.report_user', 'Signaler cet utilisateur')}
                      >
                        <MdFlag size={16} />
                        {t('report.report', 'Signaler')}
                      </button>
                    </>
                  )}
{/* 
                  {!isSelf && !accessInfo?.canInteract && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
                      <MdInfo size={16} />
                      <span className="text-sm">
                        {user.status === 'banned' 
                          ? 'Utilisateur banni - Interactions limitées'
                          : 'Utilisateur suspendu - Interactions limitées'
                        }
                      </span>
                    </div>
                  )} */}
                </div>
              </div>
            </>
          )}
          {(currentUser?.role === 'admin' && !isSelf) && (
            <button
              onClick={async () => {
                try {
                  const newRole = user.role === 'moderator' ? 'user' : 'moderator';
                  alert(t('profile.role_demo', { role: newRole }))
                } catch (err) {
                  alert(t('profile.role_error'))
                }
              }}
              className="mt-4 inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-md"
            >
              {user.role === 'moderator' ? t('profile.demote') : t('profile.promote')}
            </button>
          )}
          {(currentUser?.role === 'admin' && !isSelf) || (currentUser?.role !== 'admin' && isSelf) ? (
            <button
              onClick={async () => {
                if (confirm(t('profile.delete_confirm'))) {
                  try {
                    const res = await api.delete(`/users/${user._id}`);
                    const data = res.data;
                    if (data.redirect) {
                      window.location.href = "/login";
                    }
                    
                    alert(t('profile.delete_success'));
                    window.location.href = "/";
                  } catch (err) {
                    alert(t('profile.delete_error'));
                  }
                }
              }}
              className="mt-4 inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 font-semibold ml-3 shadow-md"
            >
              {t('profile.delete_account')}
            </button>
          ) : null}
        </div>
      </div>

      {/* Modal de signalement */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        userId={user._id}
        userName={user.username}
      />

      {/* Publications */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          {t('profile.posts')}
          {user.status && user.status !== 'active' && (
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              ({user.status === 'banned' ? 'Compte banni' : 'Compte suspendu'})
            </span>
          )}
        </h2>
        <PostList 
          fetchUrl={`/api/posts/user/${user._id}`}
          initialPosts={[]}
          onDelete={(postId) => {
            console.log('Post supprimé dans le profil:', postId);
          }}
          onLike={(postId, update) => {
            console.log('Like dans le profil:', postId, update);
          }}
        />
      </div>
    </div>
  )
}