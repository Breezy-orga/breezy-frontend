'use client'

import { useState, useEffect } from 'react'
import { MdClose, MdSearch, MdSend } from 'react-icons/md'
import { useTranslation } from 'react-i18next';

interface User {
  _id: string
  username: string
  name?: string
  avatar?: string
  profilePicture?: string
  isOnline?: boolean
}

interface NewMessageModalProps {
  isOpen: boolean
  onClose: () => void
}

// Fonction utilitaire pour les avatars
const getAvatarUrl = (user: User): string => {
  return user.profilePicture || user.avatar || '/default-avatar.svg';
};

export default function NewMessageModal({ isOpen, onClose }: NewMessageModalProps) {
  const [followings, setFollowings] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    setFollowings([])
    setSelectedUser(null)
    setQuery('')
    setMessage('')
    setSendError(null)
    
    ;(async () => {
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' })
        if (!res.ok) throw new Error(t('messagerie.load_error', 'Impossible de charger vos abonnements'))
        const me = await res.json()
        
        if (!Array.isArray(me.following) || me.following.length === 0) {
          setFollowings([])
        } else {
          const users = await Promise.all(
            me.following.map(async (id: string) => {
              const r = await fetch(`/api/users/getById/${id}`, { credentials: 'include' })
              if (!r.ok) return null
              return await r.json()
            })
          )
          setFollowings(users.filter(Boolean))
        }
      } catch (err: any) {
        setLoadError(err.message || t('messagerie.error_network', 'Erreur réseau'))
      } finally {
        setLoading(false)
      }
    })()
  }, [isOpen, t])

  const filtered = followings.filter(u =>
    u.username.toLowerCase().includes(query.toLowerCase())
  )

  const handleSend = async () => {
    if (!selectedUser || !message.trim()) return
    setSending(true)
    setSendError(null)
    
    try {
      const res = await fetch('/api/privateMessages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          receiverId: selectedUser._id,
          content: message.trim()
        })
      })
      if (!res.ok) throw new Error(t('messagerie.send_error', 'Erreur lors de l\'envoi'))
      window.location.href = `/messagerie/${selectedUser._id}`
    } catch (err: any) {
      setSendError(err.message || t('messagerie.error_network', 'Erreur réseau'))
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-auto transform transition-all duration-300 scale-100">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {selectedUser 
              ? t('messagerie.send_to', `Envoyer à @${selectedUser.username}`, { user: selectedUser.username })
              : t('messagerie.new_message', 'Nouveau message')
            }
          </h2>
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={onClose}
            aria-label={t('common.close', 'Fermer')}
          >
            <MdClose className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {!selectedUser ? (
            <>
              {/* Barre de recherche */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MdSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl
                    bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                  placeholder={t('messagerie.search_following', 'Rechercher un abonnement...')}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Liste des utilisateurs */}
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-300">
                      {t('messagerie.loading', 'Chargement...')}
                    </span>
                  </div>
                ) : loadError ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 text-red-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-red-500 font-medium">{loadError}</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-gray-600">
                      <MdSearch className="w-full h-full" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      {followings.length === 0 
                        ? t('messagerie.no_followings', 'Vous ne suivez personne pour le moment')
                        : t('messagerie.no_following_found', 'Aucun abonnement trouvé')
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filtered.map(u => (
                      <button
                        key={u._id}
                        className="w-full flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors group"
                        onClick={() => setSelectedUser(u)}
                      >
                        <div className="relative">
                          <img
                            src={getAvatarUrl(u)}
                            alt={u.username}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-gray-700 shadow-sm"
                            onError={(e) => {
                              e.currentTarget.src = '/default-avatar.svg';
                            }}
                          />
                          {u.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-700">
                              <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4 flex-1 text-left">
                          <p className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {u.name || u.username}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{u.username}
                            {u.isOnline && (
                              <span className="ml-2 text-green-500 dark:text-green-400">
                                • {t('messagerie.online', 'En ligne')}
                              </span>
                            )}
                          </p>
                        </div>
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Utilisateur sélectionné */}
              <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl mb-4">
                <img
                  src={getAvatarUrl(selectedUser)}
                  alt={selectedUser.username}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-gray-600 shadow-sm"
                  onError={(e) => {
                    e.currentTarget.src = '/default-avatar.svg';
                  }}
                />
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedUser.name || selectedUser.username}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{selectedUser.username}
                    {selectedUser.isOnline && (
                      <span className="ml-2 text-green-500 dark:text-green-400">
                        • {t('messagerie.online', 'En ligne')}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-gray-600 transition-colors"
                  disabled={sending}
                >
                  <MdClose className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Zone de message */}
              <div className="space-y-4">
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl resize-none
                    bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                  rows={4}
                  placeholder={t('messagerie.message_placeholder', `Message à @${selectedUser.username}...`, { user: selectedUser.username })}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  autoFocus
                  disabled={sending}
                />
                
                {sendError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 text-sm">{sendError}</p>
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="flex gap-3">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none disabled:cursor-not-allowed"
                    onClick={handleSend}
                    disabled={sending || !message.trim()}
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        {t('messagerie.sending', 'Envoi...')}
                      </>
                    ) : (
                      <>
                        <MdSend className="w-5 h-5" />
                        {t('messagerie.send', 'Envoyer')}
                      </>
                    )}
                  </button>
                  
                  <button
                    className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium transition-colors"
                    onClick={() => setSelectedUser(null)}
                    disabled={sending}
                  >
                    {t('common.back', 'Retour')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}