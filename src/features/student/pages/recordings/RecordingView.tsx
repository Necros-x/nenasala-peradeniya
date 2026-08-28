"use client";

import Link from "next/link";
import { ArrowLeft, Clock3, ExternalLink, Film, ShieldCheck, Video } from "lucide-react";
import { Badge } from "@/features/student/components/ui/Badge";
import { Card } from "@/features/student/components/ui/Card";
import type { CourseRecording } from "@/features/student/types";

function durationLabel(seconds?: number) {
  if (!seconds) return "Duration not set";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
}

export default function RecordingView({ recording }: { recording: CourseRecording | null }) {
  if (!recording) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <Film className="mx-auto mb-4 h-10 w-10 text-[var(--color-text-muted)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Recording unavailable</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          This recording may not be assigned to your class, may not be published, or its availability window may have ended.
        </p>
        <Link
          href="/student/recordings"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-elevated)]"
        >
          Back to Recordings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <Link
        href="/student/recordings"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to recordings
      </Link>

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="default">{recording.courseTitle}</Badge>
          {recording.required && (
            <Badge variant="warning">
              <ShieldCheck className="mr-1 h-3 w-3" /> Required
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">{recording.title}</h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">{recording.className}</p>
      </div>

      <Card className="overflow-hidden">
        {recording.playerType === "embed" && recording.playerUrl ? (
          <div className="aspect-video bg-[var(--color-static-black)]">
            <iframe
              src={recording.playerUrl}
              title={recording.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : recording.playerType === "video" && recording.playerUrl ? (
          <div className="aspect-video bg-[var(--color-static-black)]">
            <video src={recording.playerUrl} controls playsInline className="h-full w-full" />
          </div>
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center bg-[var(--color-static-black)] px-6 text-center text-[var(--color-static-white)]">
            <ExternalLink className="mb-4 h-10 w-10 opacity-80" />
            <h2 className="text-xl font-bold">External recording</h2>
            <p className="mt-2 max-w-md text-sm text-[var(--color-static-white)]/70">
              This provider does not support an embedded player here. Open the protected recording using the button below.
            </p>
            {recording.playerUrl && (
              <a
                href={recording.playerUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-static-white)] transition-colors hover:bg-[var(--color-primary-hover)]"
              >
                Open Recording
              </a>
            )}
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--color-text-muted)]">
            <span className="flex items-center gap-2">
              <Clock3 className="h-4 w-4" /> {durationLabel(recording.durationSeconds)}
            </span>
            <span className="flex items-center gap-2">
              <Video className="h-4 w-4" /> {recording.provider ?? "Video provider"}
            </span>
          </div>

          {recording.description && (
            <p className="mt-5 whitespace-pre-wrap leading-relaxed text-[var(--color-text-secondary)]">{recording.description}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
