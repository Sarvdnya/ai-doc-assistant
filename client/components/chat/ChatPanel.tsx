"use client";

import DirectorPanel from "./DirectorPanel";
import { MessageSquare } from "lucide-react";

interface ChatPanelProps {
  documentId?: string | null;
  onGenerationStateChange?: (generating: boolean) => void;
  onVideoGenerated?: () => void;
}

export default function ChatPanel({
  documentId,
  onGenerationStateChange,
  onVideoGenerated,
}: ChatPanelProps) {
  return (
    <div
      className="h-full backdrop-blur-xl border border-[var(--border-color)] rounded-[18px] flex flex-col overflow-hidden"
      style={{ backgroundColor: "var(--glass-bg)" }}
    >
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border-color)]">
        <MessageSquare
          size={16}
          className="text-[var(--color-primary)]"
        />
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          AI Video Instructions
        </h2>
      </div>
      <div className="flex-1 min-h-0 p-4">
        <DirectorPanel
          documentId={documentId}
          onGenerationStateChange={onGenerationStateChange}
          onVideoGenerated={onVideoGenerated}
        />
      </div>
    </div>
  );
}
