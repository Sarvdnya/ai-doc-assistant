"use client";
import { useState } from "react";
import { generateOverviewVideo } from "../../src/services/video.service";
import type { VideoGenerationResult } from "../../src/services/video.service";
import { loadVideoGenerationSettings } from "../../src/services/director.service";
import { Sparkles, Loader2 } from "lucide-react";

export function GenerateOverviewButton({
  documentId,
  onVideoGenerated,
  disabled = false,
  onGenerationStart,
}: {
  documentId: string;
  onVideoGenerated: (result: VideoGenerationResult) => void;
  disabled?: boolean;
  onGenerationStart?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    onGenerationStart?.();
    try {
      const result = await generateOverviewVideo(
        documentId,
        loadVideoGenerationSettings()
      );
      onVideoGenerated(result);
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error ? err.message : "Generation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={loading || disabled}
      className={`
        inline-flex items-center gap-2
        text-white px-6 py-3 rounded-xl text-sm font-semibold 
        hover:scale-105 active:scale-95 disabled:scale-100 
        transition-all shadow-lg
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      style={{
        backgroundColor: "var(--color-primary)",
        boxShadow: `0 4px 14px rgba(var(--color-primary-rgb), 0.25)`,
      }}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles size={16} />
          Generate Overview Video
        </>
      )}
    </button>
  );
}
