"use client";

import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize,
} from "lucide-react";

interface PdfToolbarProps {
  page: number;
  totalPages: number;
  zoom: number;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function PdfToolbar({
  page,
  totalPages,
  zoom,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
}: PdfToolbarProps) {
  return (
    <div
      className="flex items-center justify-between p-3 border-b rounded-t-[18px]"
      style={{
        borderColor: "var(--border-color)",
        backgroundColor: `color-mix(in srgb, var(--bg-card) 80%, transparent)`,
      }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
        >
          <ChevronLeft size={18} />
        </button>

        <span className="text-sm font-medium text-[var(--text-primary)]">
          {page} / {totalPages}
        </span>

        <button
          onClick={onNext}
          className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onZoomOut}
          className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
        >
          <ZoomOut size={18} />
        </button>

        <span className="text-sm text-[var(--text-primary)]">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={onZoomIn}
          className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
        >
          <ZoomIn size={18} />
        </button>

        <div
          className="w-px h-5 mx-1"
          style={{ backgroundColor: "var(--border-color)" }}
        />

        <button className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
          <Download size={18} />
        </button>

        <button className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
          <Maximize size={18} />
        </button>
      </div>
    </div>
  );
}
