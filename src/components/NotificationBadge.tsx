'use client';

import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';

interface NotificationBadgeProps {
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ className }) => {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) {
    return null;
  }

  return (
    <div className={`absolute -top-1 -right-1 bg-red-500 text-white rounded-full flex items-center justify-center ${className}`}>
      <span className="text-xs px-1.5 py-0.5 min-w-[18px] text-center">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    </div>
  );
};

export default NotificationBadge;
