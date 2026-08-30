"use client";

import { useEffect, useRef, useState } from "react";
import { FileUp, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip";
const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "txt",
  "zip",
]);

function prettyBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function MaterialDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;

    const reset = () => {
      setFile(null);
      setDragging(false);
    };

    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, []);

  function choose(nextFile: File | undefined) {
    if (!nextFile) return;

    const extension = nextFile.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      toast.error("Unsupported file type. Use PDF, images, Office files, TXT or ZIP.");
      return;
    }
    if (nextFile.size > MAX_BYTES) {
      toast.error("Course materials must be 25 MB or smaller.");
      return;
    }

    const input = inputRef.current;
    if (!input) return;

    const transfer = new DataTransfer();
    transfer.items.add(nextFile);
    input.files = transfer.files;
    setFile(nextFile);
  }

  function clear(event?: React.MouseEvent) {
    event?.stopPropagation();
    if (inputRef.current) inputRef.current.value = "";
    setFile(null);
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-text-primary">File</span>
      <input
        ref={inputRef}
        name="file"
        type="file"
        required
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => choose(event.target.files?.[0])}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget === event.target) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          choose(event.dataTransfer.files?.[0]);
        }}
        className={`group relative flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed px-5 py-8 text-center transition-all ${
          dragging
            ? "border-brand-primary bg-[var(--color-primary-soft)] shadow-sm"
            : "border-border-strong bg-background hover:border-brand-primary/60 hover:bg-surface"
        }`}
      >
        {file ? (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-brand-primary">
              <FileUp className="h-6 w-6" />
            </span>
            <p className="mt-3 max-w-full truncate text-sm font-bold text-text-primary">{file.name}</p>
            <p className="mt-1 text-xs text-text-muted">{prettyBytes(file.size)} · ready to upload</p>
            <button
              type="button"
              onClick={clear}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-surface-muted hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" /> Remove file
            </button>
          </>
        ) : (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-brand-primary transition-transform group-hover:-translate-y-0.5">
              <UploadCloud className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-bold text-text-primary">Drop a file here</p>
            <p className="mt-1 text-sm text-text-secondary">or click to browse from your computer</p>
            <p className="mt-3 max-w-xl text-xs leading-5 text-text-muted">
              PDF, JPG/PNG/WebP/GIF, Word, PowerPoint, Excel, TXT or ZIP · maximum 25 MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}
