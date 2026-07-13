"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { useState } from "react";
import type { DocumentFile } from "@/components/document/types";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  document: DocumentFile | null;
}

export default function PdfViewer({ document }: Props) {
  const [numPages, setNumPages] = useState(0);

  if (!document) {
    return (
      <div className="flex h-full items-center justify-center border rounded-xl bg-white">
        <p className="text-gray-500">
          Select a PDF to preview
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full border rounded-xl bg-white p-4">
      <Document
        file={document.url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      >
        {Array.from(new Array(numPages), (_, index) => (
          <Page
            key={index}
            pageNumber={index + 1}
            width={650}
          />
        ))}
      </Document>
    </div>
  );
}