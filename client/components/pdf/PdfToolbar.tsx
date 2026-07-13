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
    <div className="flex items-center justify-between p-3 border-b bg-white rounded-t-xl">

      <div className="flex items-center gap-2">
        <button onClick={onPrev} className="p-2 rounded hover:bg-gray-100">
          <ChevronLeft size={18} />
        </button>

        <span className="text-sm font-medium">
          {page} / {totalPages}
        </span>

        <button onClick={onNext} className="p-2 rounded hover:bg-gray-100">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onZoomOut} className="p-2 rounded hover:bg-gray-100">
          <ZoomOut size={18} />
        </button>

        <span className="text-sm">
          {Math.round(zoom * 100)}%
        </span>

        <button onClick={onZoomIn} className="p-2 rounded hover:bg-gray-100">
          <ZoomIn size={18} />
        </button>

        <button className="p-2 rounded hover:bg-gray-100">
          <Download size={18} />
        </button>

        <button className="p-2 rounded hover:bg-gray-100">
          <Maximize size={18} />
        </button>
      </div>
    </div>
  );
}