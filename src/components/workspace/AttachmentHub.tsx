"use client";

import React, { useRef, useState } from "react";
import {
  Paperclip,
  Upload,
  Link as LinkIcon,
  FileText,
  FileImage,
  File as FileIcon,
  Download,
  Trash2,
  ExternalLink,
  X,
  Loader2,
} from "lucide-react";
import { ItemAttachment } from "@/types";
import { cn, formatDateTime } from "@/lib/utils";

interface AttachmentHubProps {
  itemId: string;
  attachments: ItemAttachment[];
  onChange: (attachments: ItemAttachment[]) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRequestDelete: (attachment: ItemAttachment) => void;
}

function formatBytes(bytes?: number | null): string {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentHub({
  itemId,
  attachments,
  onChange,
  onSuccess,
  onError,
  onRequestDelete,
}: AttachmentHubProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [preview, setPreview] = useState<ItemAttachment | null>(null);

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    let current = attachments;
    for (const file of list) {
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`/api/items/${itemId}/attachments`, { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Upload failed");
        current = [data.data.attachment, ...current];
        onChange(current);
        onSuccess(`Uploaded ${file.name}`);
      } catch (err) {
        onError(`${file.name}: ${err instanceof Error ? err.message : "Upload failed"}`);
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = linkTitle.trim();
    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    if (!title || !linkUrl.trim()) return;
    try {
      const res = await fetch(`/api/items/${itemId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "LINK", title, url }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const detail = data.details ? Object.values(data.details).flat().join(" ") : "";
        throw new Error(detail || data.error || "Failed to add link");
      }
      onChange([data.data.attachment, ...attachments]);
      setLinkTitle("");
      setLinkUrl("");
      setShowLinkForm(false);
      onSuccess("Link added");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to add link");
    }
  };

  const iconFor = (a: ItemAttachment) => {
    if (a.type === "PDF") return <FileText className="w-5 h-5 text-rose-500" />;
    if (a.type === "IMAGE") return <FileImage className="w-5 h-5 text-sky-500" />;
    if (a.type === "LINK") return <LinkIcon className="w-5 h-5 text-emerald-500" />;
    return <FileIcon className="w-5 h-5 text-slate-500" />;
  };

  return (
    <section
      aria-label="Resources and attachments"
      className="rounded-2xl glass-surface ring-1 ring-white/10 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-indigo-500" />
          Resources
          <span className="text-xs font-normal text-slate-400">({attachments.length})</span>
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowLinkForm((v) => !v)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <LinkIcon className="w-3.5 h-3.5" /> Add Link
          </button>
          <button
            id="upload-file-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Upload
          </button>
          <input
            ref={fileInputRef}
            id="attachment-file-input"
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.csv,.json,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
            className="hidden"
            onChange={(e) => e.target.files && void uploadFiles(e.target.files)}
          />
        </div>
      </div>

      {showLinkForm && (
        <form onSubmit={addLink} className="mb-3 grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <input
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
            placeholder="Link title"
            required
            maxLength={255}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com/docs"
            required
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" className="px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition">
            Save Link
          </button>
        </form>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-xl border-2 border-dashed p-3 transition",
          dragOver
            ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30"
            : "border-slate-200 dark:border-slate-800"
        )}
      >
        {attachments.length === 0 ? (
          <p className="text-xs text-center text-slate-400 py-6">
            Drop PDFs, images or documents here, or add a web link.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {attachments.map((a) => (
              <li
                key={a.id}
                className="group flex gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (a.type === "LINK") window.open(a.url, "_blank", "noopener,noreferrer");
                    else if (a.type === "IMAGE" || a.type === "PDF") setPreview(a);
                    else window.location.assign(`${a.url}?download=1`);
                  }}
                  className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center"
                  aria-label={`Open ${a.title}`}
                >
                  {a.type === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.url} alt={a.title} className="w-full h-full object-cover" />
                  ) : (
                    iconFor(a)
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate" title={a.title}>
                    {a.title}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {a.type === "LINK" ? new URL(a.url).hostname : `${a.type} · ${formatBytes(a.fileSize)}`}
                    {" · "}
                    {formatDateTime(a.createdAt)}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {a.type === "LINK" ? (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Open
                      </a>
                    ) : (
                      <a
                        href={`${a.url}?download=1`}
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <Download className="w-3 h-3" /> Download
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => onRequestDelete(a)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Lightbox / PDF viewer */}
      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={preview.title}
          className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-xs"
          onClick={() => setPreview(null)}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-medium truncate">{preview.title}</p>
            <div className="flex items-center gap-2">
              <a
                href={`${preview.url}?download=1`}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
              <button
                type="button"
                onClick={() => setPreview(null)}
                aria-label="Close preview"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            {preview.type === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.url} alt={preview.title} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
            ) : (
              <object
                data={preview.url}
                type="application/pdf"
                className="w-full max-w-5xl h-full rounded-lg bg-white"
                aria-label={preview.title}
              >
                <iframe src={preview.url} title={preview.title} className="w-full h-full rounded-lg bg-white" />
              </object>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
