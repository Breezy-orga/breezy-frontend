import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { format, isToday, isYesterday, isThisWeek } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { fr as frLocale } from 'date-fns/locale/fr'

export interface Conversation {
  _id: string
  withUser: {
    _id: string
    username: string
    name?: string
    profilePicture?: string
    avatar?: string
    isOnline?: boolean
  }
  lastMessage: {
    text: string
    createdAt: string
    senderId?: string
  }
  unreadCount?: number
}

function getAvatarUrl(user: { username?: string, profilePicture?: string, avatar?: string }) {
  return user.profilePicture || user.avatar || '/default-avatar.svg'
}

export default function ConversationItem({ conversation, currentUserId }: { 
  conversation: Conversation,
  currentUserId?: string 
}) {
  const { t, i18n } = useTranslation()
  const { _id, withUser, lastMessage, unreadCount = 0 } = conversation
  const date = new Date(lastMessage.createdAt)
  const locale = i18n.language === 'fr' ? frLocale : enUS
  
  // Format de date intelligent selon la langue
  const getFormattedTime = () => {
    if (isToday(date)) {
      if (i18n.language === 'fr') {
        return format(date, 'HH:mm', { locale })
      } else {
        return format(date, 'h:mm a', { locale })
      }
    } else if (isYesterday(date)) {
      return t('messagerie.yesterday', 'Hier')
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE', { locale })
    } else {
      if (i18n.language === 'fr') {
        return format(date, 'dd/MM', { locale })
      } else {
        return format(date, 'M/d', { locale })
      }
    }
  }

  const isMyMessage = lastMessage.senderId === currentUserId
  const messagePreview = isMyMessage 
    ? `${t('messagerie.you', 'Vous')}: ${lastMessage.text}` 
    : lastMessage.text

  return (
    <li className="group">
      <Link
        href={`/messagerie/${withUser._id}`}
        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-200 border border-transparent hover:border-blue-100 dark:hover:border-gray-600"
      >
        {/* Avatar avec indicateur en ligne */}
        <div className="relative flex-shrink-0">
          <img
            src={getAvatarUrl(withUser)}
            alt={withUser.username}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-md"
            onError={(e) => {
              e.currentTarget.src = '/default-avatar.svg';
            }}
          />
          
          {/* Indicateur en ligne */}
          {withUser.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5">
              <div className="w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-800 shadow-sm">
                <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
          
          {/* Badge de messages non lus */}
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>

        {/* Contenu de la conversation */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Nom d'utilisateur */}
          <div className="flex items-center justify-between">
            <p className={`font-semibold truncate transition-colors ${
              unreadCount > 0 
                ? 'text-gray-900 dark:text-white' 
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              {withUser.name || withUser.username}
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                @{withUser.username}
              </span>
              {withUser.isOnline && (
                <span className="ml-2 text-xs text-green-500 font-normal">
                  • {t('messagerie.online', 'En ligne')}
                </span>
              )}
            </p>
            
            {/* Heure du dernier message */}
            <span className={`text-xs whitespace-nowrap transition-colors ${
              unreadCount > 0 
                ? 'text-blue-600 dark:text-blue-400 font-medium' 
                : 'text-gray-400 dark:text-gray-500'
            }`}>
              {getFormattedTime()}
            </span>
          </div>
          
          {/* Aperçu du dernier message */}
          <p className={`text-sm truncate transition-colors ${
            unreadCount > 0 
              ? 'text-gray-600 dark:text-gray-300 font-medium' 
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {messagePreview}
          </p>
        </div>

        {/* Flèche de navigation (visible au hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg 
            className="w-5 h-5 text-gray-400 dark:text-gray-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </li>
  )
}