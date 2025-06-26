'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppSidebar from '@/components/AppSidebar'
import MessageBubble from '@/components/MessageBubble'

type Message = {
  _id: string
  senderId: string
  content: string
  timestamp: string
}

type User = {
  _id: string
  username: string
  avatar?: string
}

export default function ConversationPage() {
  const { conversation: convId } = useParams()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [receiver, setReceiver] = useState<User | null>(null)

  // Récupère l'utilisateur connecté
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' })
        if (!res.ok) throw new Error('Erreur récupération utilisateur')
        const user = await res.json()
        setCurrentUserId(user._id)
      } catch (err) {
        console.error(err)
      }
    }
    fetchMe()
  }, [])

  // Récupère le destinataire
  useEffect(() => {
    if (!convId) return
    ;(async () => {
      try {
        const res = await fetch(`/api/users/getById/${convId}`, { credentials: 'include' })
        if (!res.ok) throw new Error('Erreur récupération destinataire')
        const user = await res.json()
        setReceiver(user)
      } catch (err) {
        setReceiver(null)
      }
    })()
  }, [convId])

  // Récupère les messages
  useEffect(() => {
    if (!convId) return
    ;(async () => {
      try {
        const res = await fetch(`/api/privateMessages/messagesWith/${convId}`, { credentials: 'include' })
        if (!res.ok) throw new Error(`Erreur ${res.status}`)
        const data = (await res.json()) as Message[]
        setMessages(data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()))
      } catch (err) {
        setMessages([])
      }
    })()
  }, [convId])

  // Scroll auto tout en bas
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Envoie de message
  const sendMessage = async () => {
    if (!newMessage.trim()) return
    try {
      const res = await fetch('/api/privateMessages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ receiverId: convId, content: newMessage }),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const saved = (await res.json()) as Message
      setMessages((prev) => [...prev, saved])
      setNewMessage('')
    } catch (err) {
      // ...
    }
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AppSidebar />

      {/* Main */}
      <main className="flex-1 flex flex-col h-screen">
        {/* Bloc central unique */}
        <div className="flex flex-col w-full max-w-2xl mx-auto h-full bg-white rounded-lg shadow border">

          {/* En-tête conversation */}
          <div className="flex items-center p-4 border-b bg-white sticky top-0 z-10">
            <span
              onClick={() => router.back()}
              className="text-2xl mr-4 cursor-pointer select-none px-1 hover:text-blue-600"
              title="Retour"
            >←</span>
            {receiver && (
              <>
                <img
                  src={receiver.avatar || '/default-avatar.png'}
                  alt={receiver.username}
                  className="w-10 h-10 rounded-full object-cover mr-3"
                />
                <span className="font-semibold text-lg">{receiver.username}</span>
              </>
            )}
          </div>

          {/* Liste des messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col space-y-2 bg-white">
            {currentUserId &&
              messages.map((m) => (
                <MessageBubble
                  key={m._id}
                  message={m}
                  me={currentUserId}
                />
              ))}
            <div ref={scrollRef} />
          </div>

          {/* Zone de saisie */}
          <div className="p-4 border-t bg-white flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 border rounded-full px-4 py-2 mr-2 focus:outline-none"
              placeholder="Écrire un message…"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
            >
              Envoyer
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
