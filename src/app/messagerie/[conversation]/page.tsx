'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppSidebar from '@/components/AppSidebar'
import MessageBubble from '@/components/MessageBubble'
import { useTranslation } from 'react-i18next';

type Message = {
  _id: string
  senderId: string
  content: string
  timestamp: string
}

type User = {
  _id: string
  username: string
  profilePicture?: string
  avatar?: string
}

function formatDateLabel(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function DateLabel({ date }: { date: string }) {
  return (
    <div className="w-full flex justify-center my-3">
      <span className="bg-gray-100 text-gray-700 px-4 py-1 rounded-full font-semibold text-sm">
        {formatDateLabel(date)}
      </span>
    </div>
  )
}

function getAvatarUrl(user?: { profilePicture?: string; avatar?: string }) {
  if (user?.profilePicture) return user.profilePicture
  if (user?.avatar) return user.avatar
  return '/default-avatar.png'
}

export default function ConversationPage() {
  const { conversation: receiverId } = useParams() // ← renommé pour clarifier qu'il s'agit de l'ID du destinataire
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [receiver, setReceiver] = useState<User | null>(null)
  const { t } = useTranslation();

  // Récupère l'utilisateur connecté
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' })
        if (!res.ok) throw new Error('Erreur récupération utilisateur')
        const user = await res.json()
        setCurrentUserId(user._id)
        console.log('Utilisateur connecté:', user._id) // Log pour débogage
      } catch (err) {
        console.error("Erreur récupération utilisateur:", err)
      }
    }
    fetchMe()
  }, [])

  // Récupère le destinataire
  useEffect(() => {
    if (!receiverId) return
    ;(async () => {
      try {
        const res = await fetch(`/api/users/getById/${receiverId}`, { credentials: 'include' })
        if (!res.ok) throw new Error('Erreur récupération destinataire')
        const user = await res.json()
        setReceiver(user)
        console.log('Destinataire:', user.username, user._id) // Log pour débogage
      } catch (err) {
        console.error("Erreur récupération destinataire:", err)
        setReceiver(null)
      }
    })()
  }, [receiverId])

  // Récupère les messages
  useEffect(() => {
    if (!receiverId) return
    ;(async () => {
      try {
        console.log('Récupération des messages avec:', receiverId) // Log pour débogage
        const res = await fetch(`/api/privateMessages/messagesWith/${receiverId}`, { 
          credentials: 'include',
          cache: 'no-store' // Éviter la mise en cache
        })
        if (!res.ok) throw new Error(`Erreur ${res.status}`)
        const data = (await res.json()) as Message[]
        console.log('Messages récupérés:', data.length) // Log pour débogage
        setMessages(data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()))
      } catch (err) {
        console.error("Erreur récupération messages:", err)
        setMessages([])
      }
    })()
  }, [receiverId])

  // Scroll auto tout en bas
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Envoie de message
  const sendMessage = async () => {
    if (!newMessage.trim()) return
    try {
      console.log('Envoi de message à:', receiverId) // Log pour débogage
      
      const res = await fetch('/api/privateMessages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ receiverId: receiverId, content: newMessage }),
      })
      
      if (!res.ok) {
        console.error(`Erreur ${res.status}:`, await res.text())
        throw new Error(`Erreur ${res.status}`)
      }
      
      const saved = await res.json()
      console.log('Message sauvegardé:', saved) // Log pour débogage
      
      // Vérifier que le message reçu a la structure attendue
      if (!saved._id || !saved.senderId || !saved.content) {
        console.warn("Message reçu avec structure incomplète:", saved)
      }
      
      setMessages((prev) => [...prev, saved])
      setNewMessage('')
    } catch (err) {
      console.error("Erreur d'envoi de message:", err)
      alert("Erreur lors de l'envoi du message")
    }
  }

  let lastDate = ''
  function shouldShowDate(ts: string) {
    const date = new Date(ts).toDateString()
    if (date !== lastDate) {
      lastDate = date
      return true
    }
    return false
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
                  src={getAvatarUrl(receiver)}
                  alt={receiver?.username}
                  className="w-10 h-10 rounded-full object-cover mr-3"
                />  
                <span className="font-semibold text-lg">{receiver.username}</span>
              </>
            )}
          </div>

          {/* Liste des messages avec affichage des dates */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col space-y-2 bg-white">
            {messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p>Commencez la conversation en envoyant un message</p>
              </div>
            )}
            
            {currentUserId &&
              messages.map((m, idx) => {
                const prev = messages[idx - 1]
                const currentDate = new Date(m.timestamp).toDateString()
                const prevDate = prev ? new Date(prev.timestamp).toDateString() : null
                const showDate = idx === 0 || currentDate !== prevDate

                return (
                  <div key={m._id}>
                    {showDate && <DateLabel date={m.timestamp} />}
                    <MessageBubble
                      message={m}
                      me={currentUserId}
                    />
                  </div>
                )
              })}
            <div ref={scrollRef} />
          </div>

          {/* Zone de saisie */}
          <div className="p-4 border-t bg-white flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              className="flex-1 border rounded-full px-4 py-2 mr-2 focus:outline-none"
              placeholder={"Entrez votre message"}
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
            >
              {"Envoyer"}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}