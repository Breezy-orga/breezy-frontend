import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale/fr'

export interface Conversation {
  _id: string
  withUser: {
    _id: string
    username: string
    avatar?: string
  }
  lastMessage: {
    text: string
    createdAt: string
  }
}

export default function ConversationItem({ conversation }: { conversation: Conversation }) {
  const { _id, withUser, lastMessage } = conversation
  const date = new Date(lastMessage.createdAt)

return (
  <li>
    <Link 
      href={`/messagerie/${_id}`} 
      className="flex items-center space-x-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <img src={withUser.avatar || '/default-avatar.png'} className="w-10 h-10 rounded-full" />
      <div className="flex-1">
        <p className="font-medium text-blue-600">{withUser.username}</p>
        <p className="text-sm text-gray-500 line-clamp-1">{lastMessage.text}</p>
      </div>
      <span className="text-xs text-gray-400">{format(date, 'HH:mm', { locale: fr })}</span>
    </Link>
  </li>
)
}
