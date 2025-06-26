'use client'

import { useState, useEffect } from 'react'
import ConversationList from '@/components/ConversationList'
import AppSidebar from '@/components/AppSidebar'
import NewMessageModal from '@/components/NewMessageModal'
import { MdMail } from 'react-icons/md'
import { useTranslation } from 'react-i18next';

interface User {
  _id: string
  username: string
  avatar?: string,
  profilePicture?: string
}

interface Conversation {
  _id: string
  withUser: User
  lastMessage: {
    text: string
    createdAt: string
  }
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { t } = useTranslation();

  useEffect(() => {
    ;(async () => {
      setLoading(true)
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

  const sortedConversations = [...conversations].sort(
    (a, b) =>
      new Date(b.lastMessage.createdAt).getTime() -
      new Date(a.lastMessage.createdAt).getTime()
  )

  const filteredConversations = search.trim().length > 0
    ? sortedConversations.filter(conv =>
        conv.withUser.username
          .toLowerCase()
          .startsWith(search.trim().toLowerCase())
      )
    : sortedConversations
      

  return (
    <div className="relative min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 p-6">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col min-h-[60vh]">
          <h2 className="text-xl font-semibold mb-4">{t('Messages.Conversations')}</h2>

          {/* Barre de recherche */}
          <input
            type="text"
            className="mb-4 px-4 py-2 border rounded focus:outline-none w-full"
            placeholder={t('Messages.SearchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {loading ? (
            <p className="text-center mt-6">{t('Messages.LoadingConversations')}</p>
          ) : error ? (
            <p className="text-center text-red-500 mt-6">{error}</p>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <p className="text-center text-gray-500">
                  {search.trim().length === 0
                    ? t('Messages.NoConversations')
                    : t('Messages.NoResultsFound')}
                </p>
              ) : (
                <ConversationList conversations={filteredConversations} />
              )}
            </div>
          )}
        </div>

        {/* Bouton flottant */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center"
          aria-label={t('Messages.NewMessage')}
        >
          <MdMail size={24} />
        </button>

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
