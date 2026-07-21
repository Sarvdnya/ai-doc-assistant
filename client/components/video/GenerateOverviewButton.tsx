"use client";
import { useState } from "react";
import { generateOverviewVideo } from "../../src/services/video.service";
import type { VideoGenerationResult } from "../../src/services/video.service";
import { loadVideoGenerationSettings } from "../../src/services/director.service";

export function GenerateOverviewButton({
  documentId,
  onVideoGenerated,
  disabled = false,
}: {
  documentId: string;
  onVideoGenerated: (result: VideoGenerationResult) => void;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateOverviewVideo(documentId, loadVideoGenerationSettings());
      onVideoGenerated(result);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleGenerate}
        disabled={loading || disabled}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Generating...
          </span>
        ) : (
          "Generate Overview Video"
        )}
      </button>
    </div>
  );
}
