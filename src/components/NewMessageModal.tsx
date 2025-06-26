'use client'

import { useState, useEffect } from 'react'
import { MdClose } from 'react-icons/md'


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
  const [loadingFollowings, setLoadingFollowings] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const resMe = await fetch('/api/users/me', { credentials: 'include' })
        if (!resMe.ok) throw new Error(`Erreur ${resMe.status}`)
        const me = (await resMe.json()) as { following?: string[] }
        const ids = me.following ?? []

        const users = await Promise.all(
          ids.map(async (id) => {
            const r = await fetch(`/api/users/getById/${id}`, { credentials: 'include' })
            if (!r.ok) throw new Error(`Erreur ${r.status}`)
            return (await r.json()) as User
          })
        )

        setFollowings(users)
      } catch (err: any) {
        setLoadError(err.message)
      } finally {
        setLoadingFollowings(false)
      }
    })()
  }, [])

  const [query, setQuery] = useState('')
  const filtered = followings.filter(
    (u) => typeof u.username === 'string' && u.username.toLowerCase().includes(query.toLowerCase())
  )

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!selectedUser || !messageText.trim()) return
    setSending(true)
    setSendError(null)

    try {
      const res = await fetch('/api/privateMessages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ receiverId: selectedUser._id, content: messageText }),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      window.location.href = `/messagerie/${selectedUser._id}`
    } catch (err: any) {
      setSendError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <MdClose size={24} />
        </button>

        <h2 className="text-xl font-semibold mb-4">
          {selectedUser ? `À ${selectedUser.username}` : 'Nouveau message'}
        </h2>

        {selectedUser ? (
          <>
            <textarea
              rows={4}
              placeholder="Écrire votre message…"
              className="w-full mb-2 px-4 py-2 border rounded focus:outline-none"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            {sendError && <p className="text-red-500 mb-2">{sendError}</p>}
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Envoi…' : 'Envoyer'}
            </button>
          </>
        ) : (
          <>
            {loadingFollowings ? (
              <p>Chargement de vos abonnements…</p>
            ) : loadError ? (
              <p className="text-red-500">Erreur : {loadError}</p>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Rechercher un abonné…"
                  className="w-full mb-4 px-4 py-2 border rounded focus:outline-none"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />

                {filtered.length === 0 && query.length >= 1 && (
                  <p className="text-gray-500">Aucun abonné ne correspond.</p>
                )}

                <ul className="max-h-60 overflow-y-auto space-y-2">
                  {filtered.map((u) => (
                    <li key={u._id}>
                      <button
                        className="w-full flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        onClick={() => setSelectedUser(u)}
                      >
                        <img
                          src={u.avatar || '/default-avatar.png'}
                          alt={u.username}
                          className="w-8 h-8 rounded-full mr-3 object-cover"
                        />
                        <div>
                          <p className="font-medium">{u.username}</p>
                          <p className="text-xs text-gray-500">@{u.username}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
