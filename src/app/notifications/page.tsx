'use client';

import React, { useState, useMemo } from 'react';
import { useNotifications, Notification } from '../../contexts/NotificationContext';
import Link from 'next/link';
import Image from 'next/image';
import { format, formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MdDelete, MdDone, MdDoneAll } from 'react-icons/md';
import { useTranslation } from 'react-i18next';


export default function NotificationsPage() {
  const { t } = useTranslation();
  const { 
    notifications, 
    loading, 
    error, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'mention' | 'like' | 'follow' | 'message'>('all');

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (id: string) => {
    setDeleting(id);
    
    try {
      const response = await fetch(`api/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      // Rafraîchir les notifications
      await fetchNotifications();
    } catch (err) {
      console.error('Erreur lors de la suppression de la notification:', err);
    } finally {
      setDeleting(null);
    }
  };

   function formatNotificationText(notification: Notification): string {
    switch (notification.type) {
      case 'mention':
        return t('notifications.mention', { user: notification.sender.username });
      case 'like':
        return t('notifications.like', { user: notification.sender.username });
      case 'follow':
        return t('notifications.follow', { user: notification.sender.username });
      case 'comment':
        return t('notifications.comment', { user: notification.sender.username });
      default:
        return t('notifications.default');
    }
  }

  const renderNotificationContent = (notification: Notification) => {
    return (
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          <Link href={`/profile/${notification.sender._id}`}>
            <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3">
              <Image 
                src={notification.sender.profilePicture || '/default-avatar.png'} 
                alt={notification.sender.username}
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
          </Link>
          <div>
            <div className="flex flex-col">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatNotificationText(notification)}
              </p>
              {notification.post && (
                <Link 
                  href={`/post/${notification.post._id}`} 
                  className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 hover:text-blue-500 dark:hover:text-blue-400"
                >
                  "{notification.post.content}"
                </Link>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatDistance(new Date(notification.createdAt), new Date(), { 
                  addSuffix: true,
                  locale: fr
                })}
              </p>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          {!notification.read && (
            <button
              onClick={() => handleMarkAsRead(notification._id)}
              className="p-1.5 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
              aria-label={t("notifications.mark_read")}
            >
              <MdDone size={18} />
            </button>
          )}
          <button
            onClick={() => handleDeleteNotification(notification._id)}
            disabled={deleting === notification._id}
            className={`p-1.5 ${
              deleting === notification._id 
                ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                : 'text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400'
            }`}
            aria-label={t("notifications.delete")}
          >
            <MdDelete size={18} />
          </button>
        </div>
      </div>
    );
  };

  // Filtrer les notifications selon le type sélectionné
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') {
      return notifications;
    }
    return notifications.filter(notification => notification.type === activeFilter);
  }, [notifications, activeFilter]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{t('notifications.title')}</h1>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <MdDoneAll size={18} className="mr-1" />
            {t('notifications.mark_all_read')}
          </button>
        )}
      </div>
      
      {/* Filtres de notifications */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        <button
          className={`px-4 py-2 rounded-full flex items-center ${activeFilter === 'all' 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          onClick={() => setActiveFilter('all')}
        >
        <span>{t('notifications.filter_all')}</span>
        </button>
        <button
          className={`px-4 py-2 rounded-full flex items-center ${activeFilter === 'mention' 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          onClick={() => setActiveFilter('mention')}
        >
          <span>{t('notifications.filter_mention')}</span>
        </button>
        <button
          className={`px-4 py-2 rounded-full flex items-center ${activeFilter === 'like' 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          onClick={() => setActiveFilter('like')}
        >
          <span>{t('notifications.filter_like')}</span>
        </button>
        <button
          className={`px-4 py-2 rounded-full flex items-center ${activeFilter === 'follow' 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          onClick={() => setActiveFilter('follow')}
        >
          <span>{t('notifications.filter_follow')}</span>
        </button>
        <button
          className={`px-4 py-2 rounded-full flex items-center ${activeFilter === 'message' 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          onClick={() => setActiveFilter('message')}
        >
          <span>{t('notifications.filter_message')}</span>
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p>{t('notifications.loading')}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md mb-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">{t('notifications.no_notifications')}</p>
        </div>
      )}
      
      {!loading && notifications.length > 0 && filteredNotifications.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">{t('notifications.no_notifications_type')}</p>
        </div>
      )}

      <div className="space-y-3">
        {filteredNotifications.map(notification => (
          <div 
            key={notification._id}
            className={`p-4 rounded-lg ${
              notification.read 
                ? 'bg-white dark:bg-gray-800' 
                : 'bg-blue-50 dark:bg-blue-900/20'
            } border ${
              notification.read 
                ? 'border-gray-200 dark:border-gray-700' 
                : 'border-blue-200 dark:border-blue-800'
            }`}
          >
            {renderNotificationContent(notification)}
          </div>
        ))}
      </div>
    </div>
  );
}
