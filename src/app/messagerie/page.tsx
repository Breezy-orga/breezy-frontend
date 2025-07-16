'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ConversationList from '@/components/ConversationList'
import AppSidebar from '@/components/AppSidebar'
import NewMessageModal from '@/components/NewMessageModal'
import { MdMail, MdSearch, MdClear } from 'react-icons/md'

interface User {
  _id: string
  username: string
  avatar?: string
  profilePicture?: string
  isOnline?: boolean
}

interface Conversation {
  _id: string
  withUser: User
  lastMessage: {
    text: string
    createdAt: string
    senderId?: string
  }
  unreadCount?: number
}

export default function MessagesPage() {
  const { t } = useTranslation()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Récupérer l'utilisateur actuel
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' })
        if (res.ok) {
          const user = await res.json()
          setCurrentUserId(user._id)
        }
      } catch (err) {
        console.error('Erreur récupération utilisateur:', err)
      }
    })()
  }, [])

  // Récupérer les conversations
  useEffect(() => {
    (async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          '/api/privateMessages/conversations',
          { credentials: 'include', cache: 'no-store' }
        )
        if (!res.ok) throw new Error(`Erreur ${res.status}`)
        const data = (await res.json()) as Conversation[]
        setConversations(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Trier les conversations par date du dernier message
  const sortedConversations = [...conversations].sort(
    (a, b) =>
      new Date(b.lastMessage.createdAt).getTime() -
      new Date(a.lastMessage.createdAt).getTime()
  )

  // Filtrer les conversations par recherche
  const filteredConversations = search.trim().length > 0
    ? sortedConversations.filter(conv =>
        conv.withUser.username
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      )
    : sortedConversations

  // Calculer les statistiques
  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
  const onlineUsers = conversations.filter(conv => conv.withUser.isOnline).length

  return (
    <div className="relative min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <AppSidebar />
      
      <main className="flex-1 p-4 lg:p-6">
        <div className="max-w-2xl mx-auto h-full flex flex-col">
          {/* En-tête avec statistiques */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {t('messagerie.title', 'Messages')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {conversations.length > 0 && (
                    <>
                      {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
                      {totalUnread > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                          {totalUnread} non lu{totalUnread > 1 ? 's' : ''}
                        </span>
                      )}
                      {onlineUsers > 0 && (
                        <span className="ml-2 text-green-500">
                          • {onlineUsers} en ligne
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
              
              {/* Bouton nouveau message (desktop) */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <MdMail className="w-5 h-5" />
                {t('messagerie.new_message', 'Nouveau message')}
              </button>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MdSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent
                  bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                  transition-all duration-200"
                placeholder={t('messagerie.search_placeholder', 'Rechercher une conversation...')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <MdClear className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Liste des conversations */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl flex-1 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="h-full flex flex-col">
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t('messagerie.loading', 'Chargement...')}
                    </p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 text-red-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-red-500 font-medium mb-2">
                      {t('messagerie.error', 'Erreur de chargement')}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                      {error}
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      {t('messagerie.retry', 'Réessayer')}
                    </button>
                  </div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 text-gray-300 dark:text-gray-600">
                      {search.trim().length === 0 ? (
                        <MdMail className="w-full h-full" />
                      ) : (
                        <MdSearch className="w-full h-full" />
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {search.trim().length === 0
                        ? t('messagerie.no_conversation', 'Aucune conversation')
                        : t('messagerie.no_results', 'Aucun résultat')
                      }
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                      {search.trim().length === 0
                        ? t('messagerie.start_conversation', 'Commencez une nouvelle conversation')
                        : t('messagerie.try_different_search', 'Essayez une recherche différente')
                      }
                    </p>
                    {search.trim().length === 0 && (
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {t('messagerie.new_message', 'Nouveau message')}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4">
                  <ConversationList 
                    conversations={filteredConversations}
                    currentUserId={currentUserId || undefined}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bouton flottant (mobile) */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 transform hover:scale-110 z-50"
          aria-label={t('messagerie.new_message')}
        >
          <MdMail size={24} />
        </button>

        {/* Modal nouveau message */}
        {isModalOpen && (
          <NewMessageModal
            isOpen={true}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </main>
    </div>
  )
}