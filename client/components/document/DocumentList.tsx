"use client";

import { Search, FileText } from "lucide-react";
import type { DocumentFile } from "./types";

interface DocumentListProps {
  documents: DocumentFile[];
selectedDocument: DocumentFile | null;
onSelectDocument: (doc: DocumentFile) => void;
}

export default function DocumentList({
  documents,
  selectedDocument,
  onSelectDocument,
}: DocumentListProps) {
  return (
    <div className="w-72 bg-white border-r p-4 text-black flex flex-col">

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">
          Documents
        </h2>
      </div>

      {/* Search */}
      <div className="flex items-center border rounded-lg px-3 py-2 mb-4">
        <Search size={18} className="text-gray-500" />

        <input
          type="text"
          placeholder="Search documents..."
          className="ml-2 w-full outline-none"
        />
      </div>

      {/* Document List */}
      <div className="space-y-2 overflow-y-auto">

        {documents.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-10">
            No documents uploaded.
          </p>
        )}

        {documents.map((doc) => (
          <div
            key={doc.id}
            onClick={() => onSelectDocument(doc)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition ${
              selectedDocument?.id === doc.id
                ? "bg-blue-100 border border-blue-400"
                : "hover:bg-gray-100"
            }`}
          >
            <FileText size={20} />

            <span className="text-sm truncate">
              {doc.name}
            </span>
          </div>
        ))}

      </div>

    </div>
  );
}