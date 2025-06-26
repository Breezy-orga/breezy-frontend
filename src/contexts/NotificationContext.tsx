'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export interface Notification {
  _id: string;
  recipient: string;
  sender: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  type: 'mention' | 'like' | 'follow' | 'comment';
  post?: {
    _id: string;
    content: string;
  };
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (typeof window === 'undefined') return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }

      const data = await response.json();
      setNotifications(data);

      // Calculer le nombre de notifications non lues
      const unread = data.filter((notification: Notification) => !notification.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Erreur lors de la récupération des notifications:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      const response = await fetch(`api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, read: true } 
            : notif
        )
      );
      
      // Décrémenter le compteur de notifications non lues
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erreur lors du marquage de la notification comme lue:', err);
    }
  };

  const markAllAsRead = async () => {
    if (typeof window === 'undefined') return;
    
    
    try {
      const response = await fetch(`api/notifications/read-all`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      // Réinitialiser le compteur de notifications non lues
      setUnreadCount(0);
    } catch (err) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', err);
    }
  };

  useEffect(() => {
    // Récupérer les notifications au chargement
    fetchNotifications();
    
    // Définir un intervalle pour actualiser les notifications
    const interval = setInterval(fetchNotifications, 60000); // 1 minute
    
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      error,
      fetchNotifications,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
