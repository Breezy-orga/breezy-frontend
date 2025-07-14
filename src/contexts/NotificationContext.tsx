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
  type: 'mention' | 'like' | 'follow' ;
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
  createNotification: (notification: Omit<Notification, '_id' | 'createdAt' | 'read'>) => Promise<void>;
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
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (typeof window === 'undefined') return;

    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/notifications', {
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          // Utilisateur non connecté, réinitialiser
          setNotifications([]);
          setUnreadCount(0);
          setLastUserId(null);
          return;
        }
        throw new Error(`Erreur: ${response.status}`);
      }

      const data = await response.json();
      setNotifications(data);

      // Calculer le nombre de notifications non lues
      const unread = data.filter((notification: Notification) => !notification.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Erreur lors de la récupération des notifications:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Timeout - Veuillez réessayer');
      } else {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si l'utilisateur a changé
  const checkAndUpdateUser = async () => {
    try {
      const response = await fetch('/api/users/me', { 
        credentials: 'include'
      });
      
      if (response.ok) {
        const user = await response.json();
        if (user._id !== lastUserId) {
          console.log('Changement utilisateur détecté:', { 
            ancien: lastUserId, 
            nouveau: user._id 
          });
          setLastUserId(user._id);
          
          // Réinitialiser les notifications pour le nouvel utilisateur
          setNotifications([]);
          setUnreadCount(0);
          setError(null);
          
          // Récupérer les nouvelles notifications
          setTimeout(fetchNotifications, 100);
        }
      } else if (response.status === 401) {
        // Utilisateur déconnecté
        if (lastUserId !== null) {
          console.log('Utilisateur déconnecté');
          setNotifications([]);
          setUnreadCount(0);
          setLastUserId(null);
          setError(null);
        }
      }
    } catch (err) {
      console.error('Erreur vérification utilisateur:', err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`/api/notifications/read-all`, {
        method: 'PUT',
        credentials: 'include',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

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

  const createNotification = async (notification: Omit<Notification, '_id' | 'createdAt' | 'read'>) => {
    if (typeof window === 'undefined') return;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify(notification)
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      // Rafraîchir les notifications après création
      await fetchNotifications();
    } catch (err) {
      console.error('Erreur lors de la création de la notification:', err);
    }
  };

  useEffect(() => {
    // Vérification initiale
    checkAndUpdateUser();
    
    // Intervalle pour vérifier les changements d'utilisateur et les nouvelles notifications
    const interval = setInterval(() => {
      checkAndUpdateUser();
      if (lastUserId) {
        fetchNotifications();
      }
    }, 500000000000);
    
    return () => clearInterval(interval);
  }, [lastUserId]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      error,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      createNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};