import React from 'react';

interface ReportNotificationBadgeProps {
  count: number;
  className?: string;
}

export const ReportNotificationBadge: React.FC<ReportNotificationBadgeProps> = ({ 
  count, 
  className = '' 
}) => {
  if (count === 0) return null;

  return (
    <div className={`ml-auto ${className}`}>
      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium leading-none text-white bg-red-500 rounded-full animate-pulse">
        {count > 99 ? '99+' : count}
      </span>
    </div>
  );
};