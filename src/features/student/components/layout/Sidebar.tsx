"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  ClipboardList, 
  HelpCircle,
  Award,
  Calendar,
  Bell,
  Settings,
  LogOut,
  X,
  ShoppingBag,
  Video,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/features/student/lib/utils';
import { Button } from '../ui/Button';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: BookOpen, label: 'My Courses', path: '/courses' },
  { icon: Video, label: 'Recordings', path: '/recordings' },
  { icon: FolderOpen, label: 'Materials', path: '/materials' },
  { icon: ShoppingBag, label: 'Course Store', path: '/store' },
  { icon: ClipboardList, label: 'Assignments', path: '/assignments' },
  { icon: HelpCircle, label: 'Quizzes', path: '/quizzes' },
  { icon: Award, label: 'Certificates', path: '/certificates' },
  { icon: Calendar, label: 'Schedule', path: '/schedule' },
];

const secondaryNavItems = [
  { icon: Bell, label: 'Announcements', path: '/announcements' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const router = useRouter();

  async function signOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Unable to sign out. Please try again.");
    }
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3 min-w-0">
          <BrandLogo className="h-8 w-auto max-w-[130px]" />
          <span className="sr-only">Nenasala Student Portal</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-6">
        <div className="space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link 
                key={item.path}
                to={item.path} 
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-sm)] transition-colors text-sm font-medium",
                  isActive 
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]" 
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto">
          <div className="px-4 py-2 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Account
          </div>
          <div className="space-y-1 mt-2">
            {secondaryNavItems.map(item => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link 
                  key={item.path}
                  to={item.path} 
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-sm)] transition-colors text-sm font-medium",
                    isActive 
                      ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]" 
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}

            <button 
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-sm)] transition-colors text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-error-soft)] hover:text-[var(--color-error)]"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
