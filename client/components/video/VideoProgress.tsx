"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, CheckCircle2, XCircle, Circle, Sparkles, Play } from "lucide-react";
import { connectProgress, type ProgressEvent } from "@/src/services/progress.service";

const STEPS = [
  { key: "extracting", label: "Extract Text" },
  { key: "overview", label: "Generate Overview" },
  { key: "images", label: "Generate Images", hasCount: true },
  { key: "audio", label: "Generate Audio", hasCount: true },
  { key: "clips", label: "Generate Clips", hasCount: true },
  { key: "rendering", label: "Render Video", hasPercent: true },
];

interface StepState {
  status: "waiting" | "running" | "completed" | "failed";
  current?: number;
  total?: number;
  message?: string;
}

interface VideoProgressProps {
  documentId: string;
  onPreview?: () => void;
  onError?: (message: string) => void;
  onStepChange?: (step: string) => void;
}

export default function VideoProgress({ documentId, onPreview, onError, onStepChange }: VideoProgressProps) {
  const [steps, setSteps] = useState<Record<string, StepState>>(() =>
    Object.fromEntries(STEPS.map((s) => [s.key, { status: "waiting" as const }]))
  );
  const [completed, setCompleted] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [finalMessage, setFinalMessage] = useState("");

  const handleProgress = useCallback((event: ProgressEvent) => {
    onStepChange?.(event.step);
    if (event.step === "completed") {
      setCompleted(true);
      setFinalMessage(event.message ?? "Video generated successfully");
      return;
    }
    if (event.step === "failed") {
      setFailed(event.message ?? "An error occurred");
      onError?.(event.message ?? "An error occurred");
      return;
    }
    setSteps((prev) => ({
      ...prev,
      [event.step]: {
        status: event.status === "failed" ? "failed" : event.status === "completed" ? "completed" : "running",
        current: event.current,
        total: event.total,
        message: event.message,
      },
    }));
  }, [onError, onStepChange]);

  const handleComplete = useCallback(() => {
    setCompleted(true);
    setFinalMessage("Video generated successfully");
  }, []);

  const handleError = useCallback((message: string) => {
    setFailed(message);
    onError?.(message);
  }, [onError]);

  useEffect(() => {
    const disconnect = connectProgress(documentId, {
      onProgress: handleProgress,
      onComplete: () => handleComplete(),
      onError: handleError,
    });
    return disconnect;
  }, [documentId, handleProgress, handleComplete, handleError]);

  const isIdle = Object.values(steps).every((s) => s.status === "waiting") && !completed && !failed;

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{
            background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
          }}
        >
          <CheckCircle2 size={32} className="text-white" />
        </div>
        <p className="text-lg font-semibold text-[var(--text-primary)]">
          {finalMessage}
        </p>
        <button
          onClick={onPreview}
          className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:scale-105 active:scale-95 transition-all shadow-lg"
          style={{
            backgroundColor: "var(--color-primary)",
            boxShadow: `0 4px 14px rgba(var(--color-primary-rgb), 0.25)`,
          }}
        >
          <Play size={16} />
          Preview Video
        </button>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ backgroundColor: `rgba(var(--color-danger-rgb), 0.15)` }}
        >
          <XCircle size={32} className="text-[var(--color-danger)]" />
        </div>
        <p className="text-lg font-semibold text-[var(--text-primary)] mt-4">
          {failed}
        </p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Please try again
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {STEPS.map((step) => {
        const state = steps[step.key];
        const isRunning = state.status === "running";
        const isCompleted = state.status === "completed";
        const isFailed = state.status === "failed";
        const isWaiting = state.status === "waiting";

        let Icon = Circle;
        let iconColor = "text-[var(--text-secondary)]";
        let iconSize = 16;

        if (isCompleted) {
          Icon = CheckCircle2;
          iconColor = "text-green-500";
        } else if (isFailed) {
          Icon = XCircle;
          iconColor = "text-[var(--color-danger)]";
        } else if (isRunning) {
          iconColor = "text-[var(--color-primary)]";
        }

        const showProgress = isRunning && (step.hasCount || step.hasPercent) && state.total && state.total > 0;
        const progressValue = state.current && state.total ? Math.round((state.current / state.total) * 100) : 0;

        return (
          <div key={step.key} className="flex items-start gap-3 py-2">
            <div className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center">
              {isRunning ? (
                <Loader2 size={iconSize} className={`animate-spin ${iconColor}`} />
              ) : (
                <Icon size={iconSize} className={iconColor} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span
                className={`text-sm font-medium ${
                  isCompleted
                    ? "text-green-500"
                    : isFailed
                    ? "text-[var(--color-danger)]"
                    : isRunning
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                {step.label}
              </span>
              {showProgress && (
                <div className="mt-1.5 space-y-1">
                  <div className="w-full h-1.5 rounded-full bg-[var(--bg-card)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300 ease-out"
                      style={{
                        width: `${progressValue}%`,
                        background: `linear-gradient(90deg, var(--color-primary), var(--color-secondary))`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {step.hasPercent ? `${progressValue}%` : `${state.current} / ${state.total}`}
                  </span>
                </div>
              )}
              {isWaiting && isIdle && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Waiting to start...
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
