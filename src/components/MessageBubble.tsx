interface Message {
  _id: string
  senderId: string | { _id: string }
  content: string
  timestamp: string
  status?: 'sent' | 'delivered' | 'seen'
}

interface Props {
  message: Message
  me: string
}

export default function MessageBubble({ message, me }: Props) {
  const senderId = typeof message.senderId === 'string'
    ? message.senderId
    : (message.senderId?._id || '')

  const isMine = senderId === me

  const date = new Date(message.timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const statusLabel = message.status === 'seen'
    ? 'Lu'
    : message.status === 'delivered'
    ? 'Envoyé'
    : ''

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} my-2`}>
      <div
        className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg shadow 
          ${isMine ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'}
        `}
      >
        <p className="text-sm">{message.content}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-400">{date}</p>
          {isMine && statusLabel && (
            <p className="text-[10px] italic ml-2 text-white opacity-70">{statusLabel}</p>
          )}
        </div>
      </div>
    </div>
  )
}
