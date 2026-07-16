"use client";

import { useCallback, useState } from "react";
import { generateOverviewVideo } from "@/src/services/video.service";
import type { VideoProject } from "./types";

interface Props {
  documentId: string;
  onVideoGenerated: (project: VideoProject) => void;
}

type Progress = "idle" | "generating" | "storyboard" | "done";
type ToastData = { kind: "success" | "error"; message: string };
type Toast = ToastData | null;

export default function GenerateOverviewButton({
  documentId,
  onVideoGenerated,
}: Props) {
  const [progress, setProgress] = useState<Progress>("idle");
  const [toast, setToast] = useState<Toast>(null);

  const showToast = useCallback(
    (kind: ToastData["kind"], message: string) => {
      setToast({ kind, message });
      if (kind === "success") {
        setTimeout(() => setToast(null), 4000);
      }
    },
    []
  );

  const handleClick = async () => {
    setProgress("generating");
    setToast(null);

    try {
      const project = await generateOverviewVideo(documentId);
      setProgress("storyboard");
      onVideoGenerated(project);
      setProgress("done");
      showToast("success", "Overview video project ready!");
    } catch (e) {
      setProgress("idle");
      const msg =
        e instanceof Error ? e.message : "Something went wrong.";
      showToast("error", msg);
    }
  };

  const label =
    progress === "generating"
      ? "Generating overview..."
      : progress === "storyboard"
        ? "Preparing storyboard..."
        : progress === "done"
          ? "Done"
          : "Generate Overview Video";

  return (
    <div className="relative">
      <button
        onClick={() => void handleClick()}
        disabled={progress === "generating" || progress === "storyboard"}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
      >
        {(progress === "generating" || progress === "storyboard") && (
          <svg
            className="animate-spin size-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {progress === "done" ? (
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : null}
        {label}
      </button>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-in slide-in-from-bottom-2 ${
            toast.kind === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.kind === "success" ? (
            <svg
              className="size-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg
              className="size-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 opacity-70 hover:opacity-100"
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {toast && toast.kind === "error" && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setToast(null)}
        />
      )}
    </div>
  );
}
