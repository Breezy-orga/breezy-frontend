'use client'

import { useState, useEffect } from 'react'
import { MdClose } from 'react-icons/md'
import { useTranslation } from 'react-i18next';

interface User {
  _id: string
  username: string
  avatar?: string
}

interface NewMessageModalProps {
  isOpen: boolean
  onClose: () => void
}

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
        // Récupère mes abonnements
        const res = await fetch('/api/users/me', { credentials: 'include' })
        if (!res.ok) throw new Error(t('messagerie.load_error', 'Unable to load your followings'))
        const me = await res.json()
        if (!Array.isArray(me.following) || me.following.length === 0) {
          setFollowings([])
        } else {
          // Pour chaque abonné, fetch les infos de base
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
        setLoadError(err.message || t('messagerie.error_network', 'Network error'))
      } finally {
        setLoading(false)
      }
    })()
  }, [isOpen])

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
      if (!res.ok) throw new Error(t('messagerie.send_error', 'Error while sending'))
      window.location.href = `/messagerie/${selectedUser._id}`
    } catch (err: any) {
      setSendError(err.message || t('messagerie.error_network', 'Network error'))
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 transition-all">
        {/* Close */}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          onClick={onClose}
          aria-label={t('media.close', 'Close')}
        >
          <MdClose size={26} />
        </button>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          {selectedUser ? t('messagerie.send_to', { user: selectedUser.username, defaultValue: 'Send to @' }) + `@${selectedUser.username}` : t('messagerie.new_message', 'New message')}
        </h2>

        {/* Sélecteur utilisateur */}
        {!selectedUser ? (
          <>
            <input
              type="text"
              className="w-full mb-3 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-600 outline-none transition"
              placeholder={t('messagerie.search_following', 'Search a following…')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
            {loading ? (
              <p className="text-gray-600 dark:text-gray-300">{t('messagerie.loading', 'Loading…')}</p>
            ) : loadError ? (
              <p className="text-red-500">{loadError}</p>
            ) : (
              <ul className="max-h-60 overflow-y-auto space-y-1">
                {filtered.length === 0 && (
                  <li className="text-gray-500 dark:text-gray-400 px-2 py-2">{t('messagerie.no_following_found', 'No following found.')}</li>
                )}
                {filtered.map(u => (
                  <li key={u._id}>
                    <button
                      className="flex items-center w-full px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                      onClick={() => setSelectedUser(u)}
                    >
                      <img
                        src={u.avatar || '/default-avatar.png'}
                        alt={u.username}
                        className="w-9 h-9 rounded-full mr-3 object-cover border border-gray-300 dark:border-gray-700"
                      />
                      <span className="text-gray-900 dark:text-gray-100 font-medium">@{u.username}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            {/* Zone de message */}
            <textarea
              className="w-full mb-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-600 outline-none transition"
              rows={4}
              placeholder={t('messagerie.message_placeholder', { user: selectedUser.username, defaultValue: `Message to @${selectedUser.username}…` })}
              value={message}
              onChange={e => setMessage(e.target.value)}
              autoFocus
              disabled={sending}
            />
            {sendError && <p className="text-red-500 mb-2">{sendError}</p>}
            <div className="flex gap-2">
              <button
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-50"
                onClick={handleSend}
                disabled={sending || !message.trim()}
              >
                {sending ? t('messagerie.sending', 'Sending…') : t('messagerie.send', 'Send')}
              </button>
              <button
                className="py-2 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                onClick={() => setSelectedUser(null)}
                disabled={sending}
              >
                {t('messagerie.cancel', 'Cancel')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
