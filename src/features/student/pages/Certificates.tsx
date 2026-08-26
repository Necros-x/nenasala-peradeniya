"use client";

import React, { useEffect, useState } from 'react';
import { Award, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { Card } from '@/features/student/components/ui/Card';
import { Button } from '@/features/student/components/ui/Button';
import { getCertificates } from '@/features/student/lib/services';
import { Certificate } from '@/features/student/types';

export default function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string | null>(null);

  useEffect(() => {
    getCertificates().then(data => {
      setCertificates(data);
      setLoading(false);
    });
  }, []);

  const handleDownload = (certId: string) => {
    setDownloading(certId);
    // Simulate PDF generation/download delay
    setTimeout(() => {
      setDownloading(null);
      setDownloaded(certId);
      // Reset success state after a few seconds
      setTimeout(() => setDownloaded(null), 3000);
    }, 1500); 
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Certificates</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">View and download your earned course certificates</p>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[var(--color-primary-soft)] rounded-full flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-[var(--color-secondary)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">No certificates yet</h3>
            <p className="text-[var(--color-text-secondary)]">Complete courses to earn your certificates.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <Card key={cert.id} className="flex flex-col group transition-shadow hover:shadow-md">
              <div className="p-6 flex-1 flex flex-col">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-warning-soft)] to-[var(--color-warning-soft)]/60 border border-[var(--color-warning)]/30 flex items-center justify-center mb-5 shrink-0 shadow-sm">
                  <Award className="w-7 h-7 text-[var(--color-warning)]" />
                </div>
                
                <h3 className="font-bold text-xl text-[var(--color-text-primary)] mb-2 line-clamp-2 leading-tight">
                  {cert.courseTitle}
                </h3>
                
                <div className="mt-auto pt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-muted)] font-medium">Date Issued</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {new Date(cert.issueDate).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-muted)] font-medium">Certificate ID</span>
                    <span className="font-mono text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] px-2 py-1 rounded">
                      {cert.certificateNumber}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 rounded-b-[var(--radius-lg)]">
                <Button 
                  className="w-full font-semibold shadow-sm transition-all"
                  variant={downloaded === cert.id ? "outline" : "default"}
                  onClick={() => handleDownload(cert.id)}
                  disabled={downloading === cert.id || downloaded === cert.id}
                >
                  {downloading === cert.id ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating PDF...</>
                  ) : downloaded === cert.id ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2 text-[var(--color-success)]" /> Downloaded</>
                  ) : (
                    <><Download className="w-4 h-4 mr-2" /> Download PDF</>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
