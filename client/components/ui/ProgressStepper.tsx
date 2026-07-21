"use client";
import { Check, Upload, FileText, Image, Mic, Video } from "lucide-react";
import type { DocumentFile } from "@/components/document/types";

interface ProgressStepperProps {
  document: DocumentFile | null;
}

const steps = [
  { key: "upload", label: "Upload", icon: Upload },
  { key: "overview", label: "Overview", icon: FileText },
  { key: "storyboard", label: "Storyboard", icon: Image },
  { key: "images", label: "Images", icon: Image },
  { key: "audio", label: "Audio", icon: Mic },
  { key: "video", label: "Video", icon: Video },
];

function getCurrentStep(doc: DocumentFile | null): number {
  if (!doc) return 0;
  if (
    doc.status === "uploading" ||
    doc.status === "processing" ||
    doc.status === "embedding"
  )
    return 0;
  if (!doc.overview) return 1;
  if (!doc.storyboard || doc.storyboard.status !== "ready") return 2;
  const hasImages = doc.storyboard.scenes.some((s) => s.imagePath);
  if (!hasImages) return 3;
  const hasAudio = doc.storyboard.scenes.some((s) => s.audioPath);
  if (!hasAudio) return 4;
  if (doc.video?.status !== "ready") return 5;
  return 6;
}

export default function ProgressStepper({ document }: ProgressStepperProps) {
  const currentStep = getCurrentStep(document);

  return (
    <div
      className="flex items-center justify-between px-4 py-3 backdrop-blur-xl rounded-[18px] border border-[var(--border-color)]"
      style={{ backgroundColor: `color-mix(in srgb, var(--bg-surface) 60%, transparent)` }}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const Icon = step.icon;

        return (
          <div
            key={step.key}
            className="flex items-center gap-2 flex-1 last:flex-none"
          >
            <div className="flex items-center gap-2">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                  ${isCompleted ? "" : ""}
                  ${
                    isCurrent
                      ? "ring-2 ring-offset-2"
                      : ""
                  }
                  ${
                    !isCompleted && !isCurrent
                      ? "border"
                      : ""
                  }
                `}
                style={{
                  backgroundColor: isCompleted
                    ? "var(--color-success)"
                    : isCurrent
                      ? "var(--color-primary)"
                      : "var(--bg-card)",
                  borderColor:
                    !isCompleted && !isCurrent ? "var(--border-color)" : undefined,
                  ["--tw-ring-color" as string]: isCurrent ? "var(--color-primary)" : undefined,
                  ["--tw-ring-offset-color" as string]: "var(--ring-offset)",
                }}
              >
                {isCompleted ? (
                  <Check size={14} className="text-white" />
                ) : (
                  <Icon
                    size={14}
                    className={
                      isCurrent ? "text-white" : "text-[var(--text-secondary)]"
                    }
                  />
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  isCurrent
                    ? "text-[var(--text-primary)]"
                    : isCompleted
                      ? "text-[var(--color-success)]"
                      : "text-[var(--text-secondary)]"
                }`}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-px mx-2 ${
                  index < currentStep ? "" : ""
                }`}
                style={{
                  backgroundColor:
                    index < currentStep
                      ? "var(--color-success)"
                      : "var(--border-color)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
