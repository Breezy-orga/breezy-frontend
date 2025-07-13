'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import AppSidebar from '@/components/AppSidebar';
import MessageBubble from '@/components/MessageBubble';
import ConfirmationModal from '@/components/ConfirmationModal';
import { MdSend, MdEmojiEmotions, MdMoreVert, MdDelete, MdSelectAll, MdClose, MdCheckCircle } from 'react-icons/md';

type Message = {
  _id: string;
  senderId: string;
  content: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'seen';
};

type User = {
  _id: string;
  username: string;
  name?: string;
  avatar?: string;
  profilePicture?: string;
  isOnline?: boolean;
  lastSeen?: string;
};

type ConfirmationState = {
  isOpen: boolean;
  type: 'deleteMessage' | 'deleteMessages' | 'deleteConversation' | null;
  title: string;
  message: string;
  onConfirm: () => void;
};

const getAvatarUrl = (user: User): string => {
  return user.profilePicture || user.avatar || '/default-avatar.svg';
};

// Liste d'emojis populaires organisée par catégories
const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
  '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤐', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞',
  '👍', '👎', '👌', '🤞', '✌️', '🤟', '🤘', '👏', '🙌', '👐',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '🔥', '💯', '💥', '💫', '⭐', '🌟', '✨', '🎉', '🎊', '🎈'
];

export default function ConversationPage() {
  const { t, i18n } = useTranslation();
  const { conversation: convId } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [receiver, setReceiver] = useState<User | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    isOpen: false,
    type: null,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    const fetchCurrentUser = async (retries = 3) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes timeout
        
        const res = await fetch('/api/users/me', { 
          credentials: 'include',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const user = await res.json();
        setCurrentUserId(user._id);
      } catch (err) {
        console.error('Erreur récupération utilisateur:', err);
        if (retries > 0) {
          console.log(`Retry dans 2s... (${retries} tentatives restantes)`);
          setTimeout(() => fetchCurrentUser(retries - 1), 2000);
        }
      }
    };
    fetchCurrentUser();
  }, []);

  // Récupère le destinataire avec retry
  useEffect(() => {
    if (!convId) return;
    
    const fetchReceiver = async (retries = 3) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const res = await fetch(`/api/users/getById/${convId}`, { 
          credentials: 'include',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const user = await res.json();
        setReceiver(user);
      } catch (err) {
        console.error('Erreur lors de la récupération du destinataire:', err);
        if (retries > 0) {
          console.log(`Retry destinataire dans 2s... (${retries} tentatives restantes)`);
          setTimeout(() => fetchReceiver(retries - 1), 2000);
        } else {
          setReceiver(null);
        }
      }
    };
    fetchReceiver();
  }, [convId]);

  // Récupère les messages avec retry
  useEffect(() => {
    if (!convId) return;
    
    const fetchMessages = async (retries = 3) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const res = await fetch(`/api/privateMessages/messagesWith/${convId}`, { 
          credentials: 'include',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Message[];
        setMessages(
          data.sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
        );
      } catch (err) {
        console.error('Erreur lors de la récupération des messages:', err);
        if (retries > 0) {
          console.log(`Retry messages dans 3s... (${retries} tentatives restantes)`);
          setTimeout(() => fetchMessages(retries - 1), 3000);
        } else {
          setMessages([]);
        }
      }
    };
    fetchMessages();
  }, [convId]);

  // Auto-scroll vers le bas
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fermer les menus quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      const emojiPicker = document.getElementById('emoji-picker')
      const emojiButton = document.getElementById('emoji-button')
      const optionsMenu = document.getElementById('options-menu')
      const optionsButton = document.getElementById('options-button')
      
      if (emojiPicker && emojiButton && !emojiPicker.contains(target) && !emojiButton.contains(target)) {
        setShowEmojiPicker(false)
      }
      
      if (optionsMenu && optionsButton && !optionsMenu.contains(target) && !optionsButton.contains(target)) {
        setShowOptionsMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Ajuste la hauteur du textarea
  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  };

  // Gestion de l'envoi de message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const tempMessage = newMessage;
    setNewMessage('');
    adjustTextareaHeight();
    
    try {
      const res = await fetch('/api/privateMessages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ receiverId: convId, content: tempMessage }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const saved = (await res.json()) as Message;
      setMessages((prev) => [...prev, saved]);
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
      setNewMessage(tempMessage);
    }
  };

  // Fonctions pour la modal de confirmation
  const showConfirmation = (
    type: ConfirmationState['type'],
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setConfirmationState({
      isOpen: true,
      type,
      title,
      message,
      onConfirm
    });
  };

  const closeConfirmation = () => {
    setConfirmationState({
      isOpen: false,
      type: null,
      title: '',
      message: '',
      onConfirm: () => {}
    });
  };

  // Suppression d'un message
  const deleteMessage = async (messageId: string) => {
    try {
      const res = await fetch(`/api/privateMessages/delete/${messageId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Erreur de suppression:', errorData);
        alert(t('messagerie.error_delete_message', 'Erreur lors de la suppression du message'));
      }
    } catch (err) {
      console.error('Erreur suppression message:', err);
      alert(t('messagerie.error_delete_message', 'Erreur lors de la suppression du message'));
    }
  };

  // Suppression de messages sélectionnés
  const deleteSelectedMessages = async () => {
    try {
      const deletePromises = Array.from(selectedMessages).map(messageId => 
        fetch(`/api/privateMessages/delete/${messageId}`, {
          method: 'DELETE',
          credentials: 'include'
        })
      );
      
      await Promise.all(deletePromises);
      setMessages(prev => prev.filter(msg => !selectedMessages.has(msg._id)));
      setSelectedMessages(new Set());
      setSelectionMode(false);
    } catch (err) {
      console.error('Erreur suppression messages:', err);
      alert(t('messagerie.error_delete_messages', 'Erreur lors de la suppression des messages'));
    }
  };

  // Suppression de toute la conversation
  const deleteConversation = async () => {
    try {
      const deletePromises = messages.map(msg => 
        fetch(`/api/privateMessages/delete/${msg._id}`, {
          method: 'DELETE',
          credentials: 'include'
        })
      );
      
      await Promise.all(deletePromises);
      router.push('/messagerie');
    } catch (err) {
      console.error('Erreur suppression conversation:', err);
      alert(t('messagerie.error_delete_conversation', 'Erreur lors de la suppression de la conversation'));
    }
  };

  // Gestion de la sélection des messages
  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const selectAllMessages = () => {
    const myMessages = messages.filter(msg => msg.senderId === currentUserId);
    const myMessageIds = myMessages.map(msg => msg._id);
    setSelectedMessages(new Set(myMessageIds));
  };

  const clearSelection = () => {
    setSelectedMessages(new Set());
    setSelectionMode(false);
  };

  // Gestion des touches clavier
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Ajouter un emoji au message
  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // Grouper les messages par expéditeur et proximité temporelle
  const groupMessages = (messages: Message[]) => {
    const groups: Message[][] = [];
    let currentGroup: Message[] = [];
    
    messages.forEach((message, index) => {
      if (currentGroup.length === 0) {
        currentGroup = [message];
      } else {
        const lastMessage = currentGroup[currentGroup.length - 1];
        const timeDiff = new Date(message.timestamp).getTime() - new Date(lastMessage.timestamp).getTime();
        const sameUser = message.senderId === lastMessage.senderId;
        
        if (sameUser && timeDiff < 2 * 60 * 1000) {
          currentGroup.push(message);
        } else {
          groups.push(currentGroup);
          currentGroup = [message];
        }
      }
      
      if (index === messages.length - 1) {
        groups.push(currentGroup);
      }
    });
    
    return groups;
  };

  const messageGroups = groupMessages(messages);

  // Formatage de la date pour les séparateurs
  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return t('messagerie.today', 'Aujourd\'hui');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('messagerie.yesterday', 'Hier');
    } else {
      if (i18n.language === 'fr') {
        return date.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      } else {
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }
    }
  };

  return (
    <div className="flex bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <AppSidebar />

      <main className="flex-1 flex flex-col h-screen">
        <div className="flex flex-col w-full max-w-4xl mx-auto h-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* En-tête conversation */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={t('common.back', 'Retour')}
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {receiver && (
                <>
                  <div className="relative">
                    <img
                      src={getAvatarUrl(receiver)}
                      alt={receiver.username}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-gray-700 shadow-md"
                      onError={(e) => {
                        e.currentTarget.src = '/default-avatar.svg';
                      }}
                    />
                    {receiver.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-800 shadow-sm">
                        <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col">
                    <h1 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                      {receiver.name || receiver.username}
                    </h1>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        @{receiver.username}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Barre d'actions pour la sélection */}
            {selectionMode && (
              <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {selectedMessages.size} {t('messagerie.selected', 'sélectionné(s)')}
                </span>
                <button
                  onClick={selectAllMessages}
                  className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                  title={t('messagerie.select_all', 'Tout sélectionner')}
                >
                  <MdSelectAll className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </button>
                {selectedMessages.size > 0 && (
                  <button
                    onClick={() => {
                      const count = selectedMessages.size;
                      const confirmMessage = i18n.language === 'fr' 
                        ? `Êtes-vous sûr de vouloir supprimer ${count} message(s) ? Cette action est irréversible.`
                        : `Are you sure you want to delete ${count} message(s)? This action is irreversible.`;
                      
                      showConfirmation(
                        'deleteMessages',
                        t('messagerie.delete_messages', 'Supprimer les messages'),
                        confirmMessage,
                        deleteSelectedMessages
                      );
                    }}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
                    title={t('messagerie.delete_selected', 'Supprimer la sélection')}
                  >
                    <MdDelete className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </button>
                )}
                <button
                  onClick={clearSelection}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={t('messagerie.cancel_selection', 'Annuler la sélection')}
                >
                  <MdClose className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}

            {/* Menu d'actions normal */}
            {!selectionMode && (
              <div className="relative">
                <button 
                  id="options-button"
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptionsMenu(!showOptionsMenu);
                  }}
                >
                  <MdMoreVert className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
                
                {showOptionsMenu && (
                  <div id="options-menu" className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
                    <button
                      onClick={() => {
                        setSelectionMode(true);
                        setShowOptionsMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <MdCheckCircle className="w-5 h-5 mr-3" />
                      {t('messagerie.select_messages', 'Sélectionner des messages')}
                    </button>
                    <button
                      onClick={() => {
                        setShowOptionsMenu(false);
                        const confirmMessage = i18n.language === 'fr' 
                          ? 'Êtes-vous sûr de vouloir supprimer toute cette conversation ? Cette action est irréversible.'
                          : 'Are you sure you want to delete this entire conversation? This action is irreversible.';
                        
                        showConfirmation(
                          'deleteConversation',
                          t('messagerie.delete_conversation', 'Supprimer la conversation'),
                          confirmMessage,
                          deleteConversation
                        );
                      }}
                      className="w-full flex items-center px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <MdDelete className="w-5 h-5 mr-3" />
                      {t('messagerie.delete_conversation', 'Supprimer la conversation')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Zone des messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-850">
            {currentUserId && messageGroups.map((group, groupIndex) => {
              const firstMessage = group[0];
              const showDateSeparator = groupIndex === 0 || 
                new Date(firstMessage.timestamp).toDateString() !== 
                new Date(messageGroups[groupIndex - 1][0].timestamp).toDateString();

              return (
                <div key={`group-${groupIndex}`}>
                  {/* Séparateur de date */}
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-6">
                      <div className="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-4 py-1 rounded-full text-xs font-medium shadow-sm">
                        {formatDateSeparator(firstMessage.timestamp)}
                      </div>
                    </div>
                  )}

                  {/* Groupe de messages */}
                  <div className="space-y-1">
                    {group.map((message, messageIndex) => (
                      <MessageBubble
                        key={message._id}
                        message={message}
                        me={currentUserId}
                        showAvatar={messageIndex === group.length - 1 && message.senderId !== currentUserId}
                        isLastInGroup={messageIndex === group.length - 1}
                        onDelete={message.senderId === currentUserId ? () => {
                          const confirmMessage = i18n.language === 'fr' 
                            ? 'Êtes-vous sûr de vouloir supprimer ce message ?'
                            : 'Are you sure you want to delete this message?';
                          
                          showConfirmation(
                            'deleteMessage',
                            t('messagerie.delete_message', 'Supprimer le message'),
                            confirmMessage,
                            () => deleteMessage(message._id)
                          );
                        } : undefined}
                        selectionMode={selectionMode}
                        isSelected={selectedMessages.has(message._id)}
                        onSelect={() => toggleMessageSelection(message._id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Indicateur de frappe */}
            {isTyping && (
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 text-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>
                  {t('messagerie.typing', '{{user}} est en train d\'écrire...', { user: receiver?.name || receiver?.username })}
                </span>
              </div>
            )}

            <div ref={scrollRef} />
          </div>

          {/* Zone de saisie */}
          {!selectionMode && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-end space-x-3">
                {/* Bouton emoji */}
                <div className="relative">
                  <button 
                    id="emoji-button"
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                  >
                    <MdEmojiEmotions className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>

                  {/* Sélecteur d'emojis */}
                  {showEmojiPicker && (
                    <div 
                      id="emoji-picker"
                      className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl p-4 z-50 min-w-[400px] max-w-[500px]"
                    >
                      <div className="mb-3">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('messagerie.select_emoji', 'Choisir un emoji')}
                        </h3>
                      </div>
                      <div className="grid grid-cols-10 gap-1 max-h-64 overflow-y-auto">
                        {EMOJI_LIST.map((emoji, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              addEmoji(emoji);
                            }}
                            className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150 hover:scale-110"
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          {t('messagerie.emoji_tip', 'Cliquez pour ajouter à votre message')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Champ de saisie */}
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      adjustTextareaHeight();
                    }}
                    onKeyPress={handleKeyPress}
                    className="w-full min-h-[40px] max-h-[120px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none
                      bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent
                      transition-all duration-200 shadow-sm"
                    placeholder={t('messagerie.type_message', 'Tapez votre message...')}
                    rows={1}
                  />
                </div>

                {/* Bouton d'envoi */}
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 
                    text-white disabled:text-gray-400 transition-colors shadow-sm hover:shadow-md
                    focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2
                    disabled:cursor-not-allowed"
                  title={t('messagerie.send', 'Envoyer')}
                >
                  <MdSend className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de confirmation */}
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={closeConfirmation}
        onConfirm={confirmationState.onConfirm}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.type === 'deleteMessage' || confirmationState.type === 'deleteMessages' || confirmationState.type === 'deleteConversation' 
          ? t('messagerie.delete', 'Supprimer') 
          : t('common.confirm', 'Confirmer')
        }
        cancelText={t('common.cancel', 'Annuler')}
        isDangerous={confirmationState.type === 'deleteMessage' || confirmationState.type === 'deleteMessages' || confirmationState.type === 'deleteConversation'}
      />
    </div>
  );
}