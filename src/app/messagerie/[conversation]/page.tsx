'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import AppSidebar from '@/components/AppSidebar';
import MessageBubble from '@/components/MessageBubble';

type Message = {
  _id: string;
  senderId: string;
  content: string;
  timestamp: string;
};

type User = {
  _id: string;
  username: string;
  avatar?: string;
};

export default function ConversationPage() {
  const { t } = useTranslation();
  const { conversation: convId } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [receiver, setReceiver] = useState<User | null>(null);

  // Récupère l'utilisateur connecté
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' });
        if (!res.ok) throw new Error('Erreur récupération utilisateur');
        const user = await res.json();
        setCurrentUserId(user._id);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // Récupère le destinataire
  useEffect(() => {
    if (!convId) return;
    (async () => {
      try {
        const res = await fetch(`/api/users/getById/${convId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Erreur récupération destinataire');
        const user = await res.json();
        setReceiver(user);
      } catch {
        setReceiver(null);
      }
    })();
  }, [convId]);

  // Récupère les messages
  useEffect(() => {
    if (!convId) return;
    (async () => {
      try {
        const res = await fetch(`/api/privateMessages/messagesWith/${convId}`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = (await res.json()) as Message[];
        setMessages(
          data.sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
        );
      } catch {
        setMessages([]);
      }
    })();
  }, [convId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Envoie de message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const res = await fetch('/api/privateMessages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ receiverId: convId, content: newMessage }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const saved = (await res.json()) as Message;
      setMessages((prev) => [...prev, saved]);
      setNewMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex bg-gray-50 dark:bg-gray-900 min-h-screen">
      <AppSidebar />

      <main className="flex-1 flex flex-col h-screen">
        <div className="flex flex-col w-full max-w-2xl mx-auto h-full bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          {/* En-tête conversation */}
          <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
            <span
              onClick={() => router.back()}
              className="text-2xl mr-4 cursor-pointer select-none px-1 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title={t('messagerie.back')}
            >
              ←
            </span>
            {receiver && (
              <>
                <img
                  src={receiver.avatar || '/default-avatar.png'}
                  alt={receiver.username}
                  className="w-10 h-10 rounded-full object-cover mr-3"
                />
                <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {receiver.username}
                </span>
              </>
            )}
          </div>

          {/* Liste des messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col space-y-2 bg-gray-50 dark:bg-gray-800">
            {currentUserId && (() => {
              let lastDate = '';
              return messages.map((m) => {
                const dateString = new Date(m.timestamp).toLocaleDateString('fr-FR', {
                  day:   '2-digit',
                  month: 'long',
                  year:  'numeric',
                });
                const showSeparator = dateString !== lastDate;
                lastDate = dateString;
                return (
                  <div key={m._id}>
                    {showSeparator && (
                      <div className="text-center text-gray-500 dark:text-gray-400 text-sm my-2">
                        {dateString}
                      </div>
                    )}
                    <MessageBubble message={m} me={currentUserId} />
                  </div>
                );
              });
            })()}
            <div ref={scrollRef} />
          </div>




          

          {/* Zone de saisie */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="
                flex-1 border border-gray-300 dark:border-gray-600
                rounded-full px-4 py-2 mr-2
                bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                placeholder-gray-500 dark:placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                transition-colors
              "
              placeholder={t('messagerie.write_message')}
            />
            <button
              onClick={sendMessage}
              className="
                px-4 py-2 rounded-full
                bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600
                text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                transition-colors
              "
            >
              {t('messagerie.send')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
