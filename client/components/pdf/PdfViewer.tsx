"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { useState } from "react";
import type { DocumentFile } from "@/components/document/types";
import { FileText } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  document: DocumentFile | null;
}

export default function PdfViewer({ document }: Props) {
  const [numPages, setNumPages] = useState(0);

  if (!document) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto border"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-color)",
            }}
          >
            <FileText size={24} className="text-[var(--text-secondary)]" />
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Select a PDF to preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="overflow-auto h-full rounded-xl p-4"
      style={{ backgroundColor: "var(--bg-background)" }}
    >
      <Document
        file={document.fileUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      >
        {Array.from(new Array(numPages), (_, index) => (
          <Page
            key={index}
            pageNumber={index + 1}
            width={650}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        ))}
      </Document>
    </div>
  );
}
