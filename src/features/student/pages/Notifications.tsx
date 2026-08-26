"use client";

import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, BookOpen, ClipboardList, Settings, Info, Filter } from 'lucide-react';
import { Card } from '@/features/student/components/ui/Card';
import { Button } from '@/features/student/components/ui/Button';
import { Badge } from '@/features/student/components/ui/Badge';
import { Skeleton } from '@/features/student/components/ui/Skeleton';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/features/student/lib/services';
import { Notification } from '@/features/student/types';
import { cn } from '@/features/student/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();

  const fetchNotifications = () => {
    getNotifications().then(data => {
      setNotifications(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    fetchNotifications();
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id);
      fetchNotifications();
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="w-5 h-5 text-[var(--color-primary)]" />;
      case 'assignment': return <ClipboardList className="w-5 h-5 text-[var(--color-primary)]" />;
      case 'system': return <Settings className="w-5 h-5 text-[var(--color-text-muted)]" />;
      case 'announcement': return <Info className="w-5 h-5 text-[var(--color-info)]" />;
      default: return <Bell className="w-5 h-5 text-[var(--color-text-muted)]" />;
    }
  };

  const filteredNotifications = notifications.filter(n => filter === 'all' || !n.read);

  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Notifications</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Stay updated on your courses and tasks</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-1">
            <button 
              onClick={() => setFilter('all')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded transition-colors",
                filter === 'all' ? "bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] shadow-sm" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              )}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('unread')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded transition-colors",
                filter === 'unread' ? "bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] shadow-sm" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              )}
            >
              Unread
            </button>
          </div>
          <Button variant="outline" onClick={handleMarkAllRead} className="hidden sm:flex gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Mark all as read
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <div className="divide-y divide-[var(--color-border)]">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 sm:p-6 flex gap-4">
                <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-[var(--color-border)]">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-[var(--color-surface-elevated)] rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-[var(--color-text-muted)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">All caught up!</h3>
                <p className="text-[var(--color-text-secondary)]">You have no {filter === 'unread' ? 'unread ' : ''}notifications at this time.</p>
              </div>
            ) : (
              filteredNotifications.map(notification => (
                <div 
                  key={notification.id} 
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "p-4 sm:p-6 flex gap-4 transition-colors cursor-pointer group",
                    !notification.read ? "bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10" : "hover:bg-[var(--color-surface-elevated)]"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex flex-col items-center justify-center shrink-0 border",
                    !notification.read ? "bg-[var(--color-surface)] border-[var(--color-border)] shadow-sm" : "bg-[var(--color-surface-elevated)] border-transparent"
                  )}>
                    {getIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={cn(
                          "font-semibold text-base",
                          !notification.read ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
                        )}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                        {notification.message}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-[var(--color-text-muted)] whitespace-nowrap shrink-0">
                      {new Date(notification.timestamp).toLocaleString(undefined, { 
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
