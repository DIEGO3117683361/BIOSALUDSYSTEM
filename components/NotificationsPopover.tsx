
import React from 'react';
import { Link } from 'react-router-dom';
import type { AppNotification } from '../types';
import { BellIcon } from './Icons';

interface NotificationsPopoverProps {
  notifications: AppNotification[];
  onClose: () => void;
}

const timeAgo = (date: string): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " años";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " días";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " horas";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutos";
    return Math.floor(seconds) + " segundos";
}

const NotificationItem: React.FC<{ notification: AppNotification; onClose: () => void; }> = ({ notification, onClose }) => {
    const content = (
        <div className="w-full text-left p-3 hover:bg-gray-100 transition-colors rounded-lg">
            <p className="text-sm text-dark-text">{notification.message}</p>
            <p className="text-xs text-dark-subtle mt-1">{timeAgo(notification.timestamp)} atrás</p>
        </div>
    );

    if (notification.link) {
        return <Link to={notification.link} onClick={onClose}>{content}</Link>
    }
    
    return <button onClick={onClose}>{content}</button>
}

const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ notifications, onClose }) => {
  return (
    <div 
        className="absolute top-full right-0 mt-2 w-80 bg-light-card rounded-xl shadow-2xl border border-light-border z-20 animate-fadeIn"
    >
      <div className="p-3 border-b border-light-border">
        <h4 className="font-semibold text-dark-text">Notificaciones</h4>
      </div>
      <div className="max-h-96 overflow-y-auto p-2">
        {notifications.length > 0 ? (
          <div className="flex flex-col gap-1">
            {notifications.map(n => (
                <NotificationItem key={n.id} notification={n} onClose={onClose} />
            ))}
          </div>
        ) : (
          <div className="text-center p-8 flex flex-col items-center">
            <BellIcon className="w-10 h-10 text-gray-300 mb-2"/>
            <p className="text-sm font-semibold text-dark-text">Todo al día</p>
            <p className="text-xs text-dark-subtle">No tienes notificaciones nuevas.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPopover;
