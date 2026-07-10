"use client";

interface PdfViewerProps {
  document: string | null;
}

export default function PdfViewer({ document }: PdfViewerProps) {
  return (
    <div className="w-full h-full bg-white rounded-lg shadow flex items-center justify-center">
      {document ? (
        <iframe
          src={`/documents/${document}`}
          className="w-full h-full rounded-lg"
          title={document}
        />
      ) : (
        <p className="text-gray-500 text-lg">
          Select a document to preview
        </p>
      )}
    </div>
  );
}