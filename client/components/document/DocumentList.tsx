"use client";

import { Search, FileText, Trash2 } from "lucide-react";
import type { DocumentFile } from "./types";

interface DocumentListProps {
  documents: DocumentFile[];
  selectedDocument: DocumentFile | null;
  onSelectDocument: (doc: DocumentFile) => void;
  onDeleteDocument: (id: string) => void;
  isLoading: boolean;
  error: string | null;
}

export default function DocumentList({
  documents,
  selectedDocument,
  onSelectDocument,
  onDeleteDocument,
  isLoading,
  error,
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

        {isLoading && (
          <p className="text-sm text-gray-500 text-center mt-10">
            Loading documents...
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 text-center mt-10">
            {error}
          </p>
        )}

        {!isLoading && !error && documents.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-10">
            No documents uploaded.
          </p>
        )}

        {!isLoading && !error && documents.map((doc) => (
          <div
            key={doc._id}
            onClick={() => onSelectDocument(doc)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition group ${
              selectedDocument?._id === doc._id
                ? "bg-blue-100 border border-blue-400"
                : "hover:bg-gray-100"
            }`}
          >
            <FileText size={20} />

            <div className="min-w-0 flex-1">
              <p className="text-sm truncate">{doc.originalName}</p>
              <p className="text-xs text-gray-500">
                {new Date(doc.uploadedAt).toLocaleString()} · {doc.status}
              </p>
            </div>

            <button
              onClick={(event) => {
                event.stopPropagation();
                onDeleteDocument(doc._id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600"
              title="Delete document"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

      </div>

    </div>
  );
}
