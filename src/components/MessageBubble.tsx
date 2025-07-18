import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Message {
  _id: string
  senderId: string | { _id: string; profilePicture?: string; name?: string; username?: string; status?: 'active' | 'banned' | 'suspended' }
  content: string
  timestamp: string
  status?: 'sent' | 'delivered' | 'seen'
}

interface Props {
  message: Message
  me: string
  showAvatar?: boolean
  isLastInGroup?: boolean
  onDelete?: () => void
  isSelected?: boolean
  onSelect?: () => void
  selectionMode?: boolean
}

export default function MessageBubble({ 
  message, 
  me, 
  showAvatar = false, 
  isLastInGroup = true,
  onDelete,
  isSelected = false,
  onSelect,
  selectionMode = false
}: Props) {
  const { t, i18n } = useTranslation()
  const [isHovered, setIsHovered] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // Extraction des informations de l'expéditeur
  const getSenderInfo = () => {
    if (typeof message.senderId === 'string') {
      return {
        id: message.senderId,
        profilePicture: '/default-avatar.png',
        name: '',
        username: '',
        status: 'active' as const
      }
    } else if (message.senderId && typeof message.senderId === 'object') {
      return {
        id: message.senderId._id || '',
        profilePicture: message.senderId.profilePicture || '/default-avatar.png',
        name: message.senderId.name || '',
        username: message.senderId.username || '',
        status: message.senderId.status || 'active' as const
      }
    }
    return {
      id: '',
      profilePicture: '/default-avatar.png',
      name: '',
      username: '',
      status: 'active' as const
    }
  }

  const senderInfo = getSenderInfo()
  const isMine = senderInfo.id === me

  // Formatage d'heure selon la langue
  const getFormattedTime = () => {
    const date = new Date(message.timestamp)
    if (i18n.language === 'fr') {
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      const menu = document.getElementById(`message-menu-${message._id}`)
      const menuButton = document.getElementById(`message-menu-button-${message._id}`)
      if (menu && menuButton && !menu.contains(target) && !menuButton.contains(target)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu, message._id])

  // Classes CSS pour l'avatar selon le statut
  const getAvatarClasses = () => {
    const baseClasses = "w-8 h-8 rounded-full object-cover border-2 flex-shrink-0"
    
    switch (senderInfo.status) {
      case 'banned':
        return `${baseClasses} border-red-400 dark:border-red-600 grayscale`
      case 'suspended':
        return `${baseClasses} border-yellow-400 dark:border-yellow-600 opacity-75`
      default:
        return `${baseClasses} border-gray-300 dark:border-gray-600`
    }
  }

  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} mb-2 group`}>
      <div 
        className={`flex items-center gap-2 ${isMine ? 'flex-row-reverse' : ''} relative`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Checkbox de sélection (visible en mode sélection pour mes messages) */}
        {selectionMode && isMine && (
          <div className="flex-shrink-0">
            <button
              onClick={onSelect}
              className={`w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center text-xs font-bold ${
                isSelected
                  ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 bg-white dark:bg-gray-700'
              }`}
            >
              {isSelected ? '✓' : '○'}
            </button>
          </div>
        )}

        {/* Avatar amélioré (seulement pour les messages des autres et si activé) */}
        {!isMine && showAvatar && (
          <div className="flex-shrink-0">
            <Image
              src={senderInfo.profilePicture}
              alt={senderInfo.name || senderInfo.username || 'Avatar utilisateur'}
              width={32}
              height={32}
              className={getAvatarClasses()}
              onError={(e) => {
                // Fallback vers l'avatar par défaut en cas d'erreur de chargement
                const target = e.target as HTMLImageElement
                target.src = '/default-avatar.png'
              }}
            />
          </div>
        )}
        
        {/* Espace pour aligner les messages groupés */}
        {!isMine && !showAvatar && <div className="w-8"></div>}

        {/* Bulle de message */}
        <div className={`max-w-xs sm:max-w-md ${isMine ? 'ml-auto' : 'mr-auto'}`}>
          <div
            className={`px-4 py-2 shadow-sm transition-all duration-200 ${
              selectionMode && isSelected 
                ? 'ring-2 ring-blue-500 ring-opacity-50' 
                : ''
            } ${
              isMine
                ? `bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-200 dark:shadow-blue-900 ${
                    isLastInGroup ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-r-md'
                  }`
                : `bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 shadow-gray-200 dark:shadow-gray-800 ${
                    isLastInGroup ? 'rounded-2xl rounded-bl-md' : 'rounded-2xl rounded-l-md'
                  }`
            }`}
          >
            {/* Contenu du message */}
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        </div>

        {/* Indicateur de statut utilisateur (optionnel) */}
        {!isMine && showAvatar && senderInfo.status !== 'active' && (
          <div className="absolute -top-1 left-6">
            <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
              senderInfo.status === 'banned' 
                ? 'bg-red-500' 
                : senderInfo.status === 'suspended' 
                ? 'bg-yellow-500' 
                : 'bg-green-500'
            }`} />
          </div>
        )}
      </div>

      {/* Heure affichée directement sous le message */}
      <div className={`flex items-center gap-1 mt-1 px-2 ${
        isMine ? 'justify-end' : 'justify-start'
      } ${!isMine && showAvatar ? 'ml-10' : ''} ${!isMine && !showAvatar ? 'ml-10' : ''} ${
        selectionMode ? (isMine ? 'mr-8' : 'ml-16') : ''
      }`}>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {getFormattedTime()}
        </span>
        
       
      </div>
    </div>
  )
}