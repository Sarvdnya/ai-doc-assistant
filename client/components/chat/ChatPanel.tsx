"use client";

import DirectorPanel from "./DirectorPanel";

interface ChatPanelProps {
  documentId?: string | null;
  onGenerationStateChange?: (generating: boolean) => void;
  onVideoGenerated?: () => void;
}

/** The single UI panel for configuring and running video production actions. */
export default function ChatPanel({ documentId, onGenerationStateChange, onVideoGenerated }: ChatPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow p-6 h-full flex flex-col text-black">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">✨ AI Video Instructions</h2>
      <div className="flex-1 min-h-0">
        <DirectorPanel
          documentId={documentId}
          onGenerationStateChange={onGenerationStateChange}
          onVideoGenerated={onVideoGenerated}
        />
      </div>
    </div>
  );
}
