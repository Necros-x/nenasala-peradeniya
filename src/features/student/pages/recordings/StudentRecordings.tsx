"use client";

import Link from "next/link";
import { Clock3, Film, PlayCircle, ShieldCheck, Video } from "lucide-react";
import { Badge } from "@/features/student/components/ui/Badge";
import { Card } from "@/features/student/components/ui/Card";
import type { CourseRecording } from "@/features/student/types";

function durationLabel(seconds?: number) {
  if (!seconds) return "Duration not set";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
}

function dateLabel(value?: string) {
  if (!value) return "Recording date not set";
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

export default function StudentRecordings({ recordings }: { recordings: CourseRecording[] }) {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Recordings</h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          Recorded classes released to the classes you are currently enrolled in.
        </p>
      </div>

      {recordings.length === 0 ? (
        <Card>
          <div className="flex min-h-72 flex-col items-center justify-center p-10 text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-[var(--color-primary-soft)]">
              <Film className="h-8 w-8 text-[var(--color-primary)]" />
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">No recordings released yet</h2>
            <p className="mt-2 max-w-md text-sm text-[var(--color-text-secondary)]">
              When an instructor or administrator publishes a recording to your class, it will appear here automatically.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {recordings.map((recording) => (
            <Card key={recording.id} className="overflow-hidden">
              <div className="aspect-video bg-[var(--color-static-black)]">
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-static-black)]">
                  <PlayCircle className="h-14 w-14 text-[var(--color-static-white)]/90" />
                </div>
              </div>

              <div className="p-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="default">{recording.courseTitle}</Badge>
                  {recording.required && (
                    <Badge variant="warning">
                      <ShieldCheck className="mr-1 h-3 w-3" /> Required
                    </Badge>
                  )}
                </div>

                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{recording.title}</h2>
                <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">{recording.className}</p>

                {recording.description && (
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{recording.description}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" /> {durationLabel(recording.durationSeconds)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5" /> {recording.provider ?? "Video"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">{dateLabel(recording.recordedAt)}</p>

                <Link
                  href={`/student/recordings/${recording.id}`}
                  className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-static-white)] transition-colors hover:bg-[var(--color-primary-hover)]"
                >
                  <PlayCircle className="mr-2 h-4 w-4" /> Watch Recording
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
