'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Check, X, Thermometer, AlertTriangle, Info } from 'lucide-react';
import { useConvexNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useUnreadNotificationsCount, type ConvexNotification as Notification } from '@/hooks/useConvexNotifications';
import { useStations } from '@/hooks/useStations';

interface NotificationDropdownProps {
  compact?: boolean;
}

export default function NotificationDropdown({ compact = false }: NotificationDropdownProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const { data: notifications = [], isLoading } = useConvexNotifications();
  const { data: stations = [] } = useStations();
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();
  const unreadCount = useUnreadNotificationsCount();

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking inside any dropdown or on the button
      if (
        (mobileDropdownRef.current && mobileDropdownRef.current.contains(target)) ||
        (desktopDropdownRef.current && desktopDropdownRef.current.contains(target)) ||
        (buttonRef.current && buttonRef.current.contains(target))
      ) {
        return;
      }
      
      // Close if clicking outside
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    markAsRead.mutateAsync(notificationId);
  };

  const handleMarkAllAsRead = (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    markAllAsRead.mutateAsync();
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'tempAlert':
        return <Thermometer className="w-5 h-5 text-red-500" />;
      case 'system':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStationName = (stationId: string) => {
    const station = stations.find(s => s.id === stationId);
    return station ? station.estacao.slice(7) : t('notifications.alertService.stationFallback', { stationId });
  };

  const formatNotificationMessage = (notification: Notification) => {
    if (notification.type === 'tempAlert' && notification.data?.stationId) {
      const stationId = notification.data.stationId as string;
      const stationName = getStationName(stationId);
      const threshold = notification.data?.threshold as number;
      const currentValue = notification.data?.currentValue as number;
      
      if (threshold && currentValue) {
        return t('notifications.alertService.temperatureExceeded', {
          stationName,
          currentTemp: currentValue.toFixed(1),
          threshold
        });
      }
      return t('notifications.alertService.temperatureAlertGeneric', { stationName });
    }
    return notification.message;
  };

  const renderNotificationsList = () => (
    <div className="divide-y divide-gray200">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 hover:bg-gray50${
            notification.read ? 'opacity-75' : ''
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray700 line-clamp-2">
                    {notification.title + ' ' + getStationName(notification.data?.stationId as string)}
                  </p>
                  <p className="text-xs text-gray700 mt-1 line-clamp-2">
                    {formatNotificationMessage(notification)}
                  </p>
                  
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray700">
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                  {!notification.read && (
                    <button
                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                      className="p-1 hover:bg-gray200 rounded"
                      title={t('notifications.markRead')}
                    >
                      <Check className="w-3 h-3 text-gray700 hover:text-gray700" />
                    </button>
                  )}
                </div>
              </div>
          
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="p-4 text-center text-gray700">
      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">{t('notifications.noNotifications')}</p>
    </div>
  );

  const renderLoadingState = () => (
    <div className="p-4 text-center text-gray700">
      <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
    </div>
  );

  return (
    <div className="relative">
      {/* Notification Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-md bg-secondary hover:bg-opacity-80${
          compact ? 'w-full flex flex-col items-center' : 'flex items-center justify-center'
        }`}
      >
        <div className="relative">
          <Bell size={16} absoluteStrokeWidth className={`${compact ? 'w-5 h-5' : 'w-4 h-4'} text-primary`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {compact && (
          <span className="text-xs text-gray700 mt-1">
            {t('notifications.title')}
          </span>
        )}
      </button>

      {/* Mobile Modal (shown on screens < 640px) */}
      {isOpen && (
        <>
          {/* Mobile Background Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-[9999] sm:hidden" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Mobile Modal Content */}
          <div
            ref={mobileDropdownRef}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm z-[9999] sm:hidden bg-background shadow-lg rounded-lg max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray200">
              <h3 className="font-semibold text-gray700">
                {t('notifications.title')}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray700" />
              </button>
            </div>

            {/* Mobile Mark All Read Button */}
            {unreadCount > 0 && (
              <div className="p-4 border-b border-gray200">
                <button
                  onClick={(e) => handleMarkAllAsRead(e)}
                  disabled={markAllAsRead.isPending}
                  className="w-full text-center text-sm text-primary hover:text-primary disabled:opacity-50"
                >
                  {t('notifications.markAllRead')}
                </button>
              </div>
            )}

            {/* Mobile Notifications List */}
            <div className="max-h-[50vh] overflow-y-auto">
              {isLoading ? renderLoadingState() : notifications.length === 0 ? renderEmptyState() : renderNotificationsList()}
            </div>
          </div>

          {/* Desktop Dropdown (shown on screens >= 640px) */}
          <div
            ref={desktopDropdownRef}
            className={`hidden sm:block absolute mt-2 bg-background shadow-lg rounded-lg z-[9999] max-h-96 overflow-hidden w-80 ${
              compact ? 'left-0' : 'right-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Desktop Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray200">
              <h3 className="font-semibold text-gray700">
                {t('notifications.title')}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={(e) => handleMarkAllAsRead(e)}
                  disabled={markAllAsRead.isPending}
                  className="text-xs text-primary hover:text-primary disabled:opacity-50"
                >
                  {t('notifications.markAllRead')}
                </button>
              )}
            </div>

            {/* Desktop Notifications List */}
            <div className="max-h-64 overflow-y-auto">
              {isLoading ? renderLoadingState() : notifications.length === 0 ? renderEmptyState() : renderNotificationsList()}
            </div>

            {/* Desktop Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray200 text-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-gray700 hover:text-gray700"
                >
                  {t('notifications.cancel')}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 