import Link from 'next/link'
import { format, isToday } from 'date-fns'
import { fr } from 'date-fns/locale/fr'

export interface Conversation {
  _id: string
  withUser: {
    _id: string
    username: string
    profilePicture?: string
    avatar?: string
  }
  lastMessage: {
    text: string
    createdAt: string
  }
}

function getAvatarUrl(user: { profilePicture?: string, avatar?: string }) {
  if (user.profilePicture) return user.profilePicture
  if (user.avatar) return user.avatar
  return '/default-avatar.png'
}

export default function ConversationItem({ conversation }: { conversation: Conversation }) {
  const { _id, withUser, lastMessage } = conversation
  const date = new Date(lastMessage.createdAt)

  const formatted =
    isToday(date)
      ? format(date, "HH:mm", { locale: fr })
      : format(date, "EEE dd MMM à HH:mm", { locale: fr })

  return (
    <li>
      <Link
        href={`/messagerie/${_id}`}
        className="flex items-center space-x-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <img
          src={getAvatarUrl(withUser)}
          alt={withUser.username}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-blue-600 truncate">{withUser.username}</p>
          <p className="text-sm text-gray-500 line-clamp-1 truncate">{lastMessage.text}</p>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{formatted}</span>
      </Link>
    </li>
  )
}
