
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LogoutIcon, BellIcon } from './Icons';
import NotificationsPopover from './NotificationsPopover';

const Header: React.FC = () => {
  const { currentUser, logout, notifications, markAllNotificationsAsRead } = useAppContext();
  const navigate = useNavigate();
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);

  const hasUnread = useMemo(() => notifications.some(n => !n.read), [notifications]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const toggleNotifications = () => {
    setNotificationsOpen(prev => !prev);
    if (!isNotificationsOpen && hasUnread) {
        markAllNotificationsAsRead();
    }
  };

  return (
    <header className="w-full h-16 flex items-center justify-between bg-light-card border-b border-light-border px-6 relative">
      <div />
      <div className="flex items-center gap-4">
        <div className="relative">
            <button
                onClick={toggleNotifications}
                title="Notificaciones"
                className="p-2 rounded-full hover:bg-gray-100 text-dark-subtle hover:text-primary transition-colors"
            >
                <BellIcon className="w-6 h-6" />
                {hasUnread && (
                    <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
            </button>
            {isNotificationsOpen && (
                <NotificationsPopover 
                    notifications={notifications} 
                    onClose={() => setNotificationsOpen(false)}
                />
            )}
        </div>
        <div>
            <p className="font-semibold text-dark-text text-right">{currentUser?.name}</p>
            <p className="text-sm text-dark-subtle text-right">{currentUser?.id === '1061698378' ? 'Admin' : 'Usuario'}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary font-bold">
            {currentUser?.name.charAt(0).toUpperCase()}
        </div>
        <button 
            onClick={handleLogout} 
            title="Cerrar Sesión"
            className="p-2 rounded-full hover:bg-gray-100 text-dark-subtle hover:text-red-500 transition-colors"
        >
            <LogoutIcon className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;
