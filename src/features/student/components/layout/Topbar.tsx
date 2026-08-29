"use client";

import React, { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '../ui/Button';
import { GlobalSearch } from '../ui/GlobalSearch';
import { NotificationBell } from '../ui/NotificationBell';
import { getCurrentStudent } from '@/features/student/lib/services';
import { Student } from '@/features/student/types';
import { Link } from 'react-router-dom';
import { ThemeMenu } from '@/components/theme/ThemeMenu';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    getCurrentStudent().then(setStudent);
  }, []);

  return (
    <header className="h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 md:px-8 shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <ThemeMenu />
        <NotificationBell />
        
        {student && (
          <Link to="/profile" className="flex items-center gap-3 pl-2 sm:pl-4 sm:border-l border-[var(--color-border)] hover:opacity-80 transition-opacity">
            <img 
              src={student.avatar} 
              alt={student.name} 
              className="w-8 h-8 rounded-full object-cover border border-[var(--color-border)]"
            />
            <div className="hidden sm:block text-sm">
              <div className="font-medium text-[var(--color-text-primary)] leading-tight">{student.name}</div>
              <div className="text-[var(--color-text-muted)] text-xs">Student</div>
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
