'use client';

import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';

interface NotificationBadgeProps {
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ className = '' }) => {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full flex items-center justify-center min-w-[18px] h-[18px] text-xs font-bold shadow-lg z-10">
        {unreadCount > 99 ? '99+' : unreadCount}
      </div>
    </div>
  );
};

export default NotificationBadge;