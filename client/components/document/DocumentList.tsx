"use client";

import { Search, FileText, Trash2, Video, Loader2 } from "lucide-react";
import type { DocumentFile } from "./types";

interface DocumentListProps {
  documents: DocumentFile[];
  selectedDocument: DocumentFile | null;
  onSelectDocument: (doc: DocumentFile) => void;
  onDeleteDocument: (id: string) => void;
  isLoading: boolean;
  error: string | null;
}

export default function DocumentList({
  documents,
  selectedDocument,
  onSelectDocument,
  onDeleteDocument,
  isLoading,
  error,
}: DocumentListProps) {
  return (
    <div
      className="w-[280px] flex-shrink-0 backdrop-blur-xl border border-[var(--border-color)] rounded-[18px] p-4 flex flex-col"
      style={{ backgroundColor: "var(--glass-bg)" }}
    >
      <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4 px-1">
        Documents
      </h2>

      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search documents..."
          className="w-full pl-9 pr-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--color-primary)]/50 focus:ring-1 focus:ring-[var(--color-primary)]/20 transition-all"
        />
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2
              size={20}
              className="text-[var(--text-secondary)] animate-spin"
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-[var(--color-danger)] text-center py-10">
            {error}
          </p>
        )}

        {!isLoading && !error && documents.length === 0 && (
          <p className="text-sm text-[var(--text-secondary)] text-center py-10">
            No documents uploaded.
          </p>
        )}

        {!isLoading &&
          !error &&
          documents.map((doc) => (
            <div
              key={doc._id}
              onClick={() => onSelectDocument(doc)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group
                ${
                  selectedDocument?._id === doc._id
                    ? "text-[var(--text-primary)] border border-[rgba(var(--color-primary-rgb),0.3)]"
                    : "hover:bg-[var(--hover-bg)] border border-transparent"
                }
              `}
              style={
                selectedDocument?._id === doc._id
                  ? { backgroundColor: `rgba(var(--color-primary-rgb), 0.15)` }
                  : {}
              }
            >
              <div
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${
                    selectedDocument?._id === doc._id
                      ? ""
                      : "bg-[var(--bg-card)]"
                  }
                `}
                style={
                  selectedDocument?._id === doc._id
                    ? {
                        background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
                      }
                    : {}
                }
              >
                <FileText
                  size={16}
                  className={
                    selectedDocument?._id === doc._id
                      ? "text-white"
                      : "text-[var(--text-secondary)]"
                  }
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm text-[var(--text-primary)] truncate font-medium">
                  {doc.originalName}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span
                    className={[
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                      doc.status === "uploading" &&
                        "bg-blue-500/20 text-blue-400 border border-blue-500/20",
                      doc.status === "processing" &&
                        "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20",
                      doc.status === "embedding" &&
                        "bg-purple-500/20 text-purple-400 border border-purple-500/20",
                      doc.status === "ready" &&
                        "bg-green-500/20 text-green-400 border border-green-500/20",
                      doc.status === "failed" &&
                        "bg-red-500/20 text-red-400 border border-red-500/20",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {doc.status === "uploading" && "Uploading"}
                    {doc.status === "processing" && "Processing"}
                    {doc.status === "embedding" && "Embedding"}
                    {doc.status === "ready" && "Ready"}
                    {doc.status === "failed" && "Failed"}
                  </span>

                  {doc.video?.status === "ready" && (
                    <>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
                        style={{
                          backgroundColor: `rgba(var(--color-primary-rgb), 0.15)`,
                          color: "var(--color-primary)",
                          borderColor: `rgba(var(--color-primary-rgb), 0.15)`,
                        }}
                      >
                        <Video size={12} />
                        Video
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {doc.overview?.sceneCount ?? "-"} scenes
                      </span>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteDocument(doc._id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-[rgba(var(--color-danger-rgb),0.15)] text-[var(--text-secondary)] hover:text-[var(--color-danger)] flex-shrink-0"
                title="Delete document"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
