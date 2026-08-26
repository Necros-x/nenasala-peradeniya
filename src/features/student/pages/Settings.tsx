"use client";

import React, { useEffect, useState } from 'react';
import { User, Bell, Mail, Camera, Loader2, Save, CheckCircle2 } from 'lucide-react';
import { Card } from '@/features/student/components/ui/Card';
import { Button } from '@/features/student/components/ui/Button';
import { Input } from '@/features/student/components/ui/Input';
import { Switch } from '@/features/student/components/ui/Switch';
import { getCurrentStudent, updateProfile } from '@/features/student/lib/services';
import { Student } from '@/features/student/types';
import { cn } from '@/features/student/lib/utils';

export default function Settings() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [emailAssignments, setEmailAssignments] = useState(true);
  const [emailAnnouncements, setEmailAnnouncements] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications'>('profile');

  useEffect(() => {
    getCurrentStudent().then(data => {
      setStudent(data);
      setName(data.name);
      setEmail(data.email);
      setBio(data.bio || '');
      if (data.preferences) {
        setEmailAssignments(data.preferences.emailAssignments);
        setEmailAnnouncements(data.preferences.emailAnnouncements);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!student) return;
    setSaving(true);
    setSaveSuccess(false);

    const updates = {
      name,
      email,
      bio,
      preferences: {
        emailAssignments,
        emailAnnouncements,
      }
    };

    const updated = await updateProfile(updates);
    setStudent(updated);
    setSaving(false);
    setSaveSuccess(true);
    
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Account Settings</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Manage your profile and notification preferences</p>
      </div>

      <div className="flex gap-2 border-b border-[var(--color-border)] pb-0">
        <button
          onClick={() => setActiveTab('profile')}
          className={cn(
            "px-6 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2",
            activeTab === 'profile' 
              ? "border-[var(--color-primary)] text-[var(--color-primary)]" 
              : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]"
          )}
        >
          <User className="w-4 h-4" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={cn(
            "px-6 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2",
            activeTab === 'notifications' 
              ? "border-[var(--color-primary)] text-[var(--color-primary)]" 
              : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]"
          )}
        >
          <Bell className="w-4 h-4" />
          Notifications
        </button>
      </div>

      {activeTab === 'profile' && (
        <Card className="max-w-2xl">
          <div className="p-6 sm:p-8 space-y-8">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <img 
                  src={student?.avatar} 
                  alt={student?.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-[var(--color-surface)] shadow-md"
                />
                <button className="absolute bottom-0 right-0 p-2 bg-[var(--color-primary)] text-[var(--color-static-white)] rounded-full shadow-lg hover:bg-[var(--color-primary-hover)] transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Profile Picture</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1 mb-3">JPG, GIF or PNG. Max size of 800K</p>
                <Button variant="outline" size="sm">Remove Photo</Button>
              </div>
            </div>

            <div className="border-t border-[var(--color-border)]"></div>

            {/* Profile Form */}
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--color-text-primary)]">Full Name</label>
                <Input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="bg-[var(--color-background)] border-[var(--color-border)] focus:bg-[var(--color-surface)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--color-text-primary)]">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <Input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="pl-9 bg-[var(--color-background)] border-[var(--color-border)] focus:bg-[var(--color-surface)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--color-text-primary)]">Bio</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a little about yourself"
                  className="w-full min-h-[120px] p-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-y text-sm text-[var(--color-text-primary)]"
                />
                <p className="text-xs text-[var(--color-text-muted)]">Brief description for your profile. URLs are hyperlinked.</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card className="max-w-2xl">
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="font-bold text-lg text-[var(--color-text-primary)] mb-1">Email Notifications</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">Choose what you want to be notified about via email.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)]">
                <div className="pr-4">
                  <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">Assignments</h4>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    Receive emails about upcoming deadlines, newly graded assignments, and feedback from instructors.
                  </p>
                </div>
                <div className="mt-1 shrink-0">
                  <Switch 
                    checked={emailAssignments}
                    onCheckedChange={setEmailAssignments}
                  />
                </div>
              </div>

              <div className="flex items-start justify-between p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)]">
                <div className="pr-4">
                  <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">Announcements</h4>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    Receive emails when an instructor posts a new announcement or updates course materials.
                  </p>
                </div>
                <div className="mt-1 shrink-0">
                  <Switch 
                    checked={emailAnnouncements}
                    onCheckedChange={setEmailAnnouncements}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Sticky Save Bar */}
      <div className="flex items-center gap-4 pt-6 max-w-2xl">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-32 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-static-white)] shadow-sm"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Changes</>
          )}
        </Button>
        {saveSuccess && (
          <span className="flex items-center text-sm font-medium text-[var(--color-success)] animate-in fade-in slide-in-from-left-4">
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Saved successfully
          </span>
        )}
      </div>
    </div>
  );
}
