// 'use client'

// import { useState, useEffect, useRef } from 'react'

// interface Message {
//   _id: string
//   senderId: string
//   content: string
//   timestamp: string
// }

// interface User {
//   _id: string
//   username: string
//   avatar?: string
// }

// interface ChatWindowProps {
//   withUser: User         // Destinataire de la conversation
//   meId: string           // Ton ID utilisateur
//   initialMessages: Message[] // Les messages initiaux (triés du plus ancien au plus récent)
//   onBack: () => void     // Callback pour retour (navigation)
// }

// export default function ChatWindow({ withUser, meId, initialMessages, onBack }: ChatWindowProps) {
//   const [messages, setMessages] = useState<Message[]>(initialMessages || [])
//   const [text, setText] = useState('')
//   const scrollRef = useRef<HTMLDivElement>(null)

//   // Scroll auto sur le message le plus bas
//   useEffect(() => {
//     scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
//   }, [messages])

//   // Envoi de message (adapter l'API selon ton backend)
//   const sendMessage = async () => {
//     if (!text.trim()) return
//     try {
//       const res = await fetch('/api/privateMessages', {
//         method: 'POST',
//         credentials: 'include',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ receiverId: withUser._id, content: text }),
//       })
//       if (!res.ok) throw new Error('Erreur API')
//       const saved = await res.json()
//       setMessages((prev) => [...prev, saved])
//       setText('')
//     } catch (e) {
//       alert('Erreur lors de l\'envoi du message')
//     }
//   }

//   // Utilitaire pour afficher la date formatée
//   const formatTime = (iso: string) =>
//     new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

//   return (
//     <div className="flex flex-col h-full w-full bg-white rounded-lg shadow overflow-hidden">
//       {/* Header */}
//       <div className="flex items-center border-b p-4">
//         <span onClick={onBack} className="text-2xl mr-4 cursor-pointer hover:text-blue-600">←</span>
//         <img
//           src={withUser.avatar || '/default-avatar.png'}
//           alt={withUser.username}
//           className="w-10 h-10 rounded-full object-cover mr-2"
//         />
//         <span className="font-bold text-lg">{withUser.username}</span>
//       </div>

//       {/* Messages (un seul bloc scrollable) */}
//       <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-2 bg-white">
//         {messages.map(msg => (
//           <div
//             key={msg._id}
//             className={`flex ${msg.senderId === meId ? 'justify-end' : 'justify-start'}`}
//           >
//             <div className={`
//               px-4 py-2 rounded-lg shadow
//               ${msg.senderId === meId
//                 ? 'bg-blue-600 text-white'
//                 : 'bg-gray-200 text-black'}
//               max-w-xs sm:max-w-md
//             `}>
//               <div className="text-sm">{msg.content}</div>
//               <div className="text-xs text-right text-gray-300 mt-1">{formatTime(msg.timestamp)}</div>
//             </div>
//           </div>
//         ))}
//         <div ref={scrollRef} />
//       </div>

//       {/* Zone de saisie */}
//       <div className="p-4 border-t flex items-center bg-white">
//         <input
//           className="flex-1 rounded-full border px-4 py-2 mr-2"
//           placeholder="Écrire un message…"
//           value={text}
//           onChange={e => setText(e.target.value)}
//           onKeyDown={e => e.key === 'Enter' && sendMessage()}
//         />
//         <button
//           onClick={sendMessage}
//           className="px-4 py-2 rounded-full bg-blue-600 text-white"
//         >
//           Envoyer
//         </button>
//       </div>
//     </div>
//   )
// }
