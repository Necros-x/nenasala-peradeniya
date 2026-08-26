"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, ClipboardList, Info, Settings, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/features/student/lib/services';
import { Notification } from '@/features/student/types';
import { cn } from '@/features/student/lib/utils';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = () => {
    getNotifications().then(setNotifications);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllNotificationsRead();
    fetchNotifications();
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id);
      fetchNotifications();
    }
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    } else {
      navigate('/notifications');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="w-4 h-4 text-[var(--color-primary)]" />;
      case 'assignment': return <ClipboardList className="w-4 h-4 text-[var(--color-primary)]" />;
      case 'system': return <Settings className="w-4 h-4 text-[var(--color-text-muted)]" />;
      case 'announcement': return <Info className="w-4 h-4 text-[var(--color-info)]" />;
      default: return <Bell className="w-4 h-4 text-[var(--color-text-muted)]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative text-[var(--color-text-secondary)]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--color-error)] border border-[var(--color-surface)]"></span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-lg overflow-hidden z-50 flex flex-col max-h-[28rem]">
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-elevated)]">
            <h3 className="font-bold text-[var(--color-text-primary)]">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-[var(--color-primary)] hover:underline flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-text-muted)] text-sm">
                No notifications right now.
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {notifications.slice(0, 5).map(notification => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full text-left p-4 flex gap-3 hover:bg-[var(--color-surface-elevated)] transition-colors",
                      !notification.read ? "bg-[var(--color-primary)]/5" : ""
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex flex-col items-center justify-center shrink-0 border",
                      !notification.read ? "bg-[var(--color-surface)] border-[var(--color-border)] shadow-sm" : "bg-[var(--color-surface-elevated)] border-transparent"
                    )}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium line-clamp-1 mb-0.5",
                        !notification.read ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5 font-medium">
                        {new Date(notification.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 mt-1.5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
            <Button 
              variant="ghost" 
              className="w-full text-sm text-[var(--color-primary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary-hover)]"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
            >
              View All Notifications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
