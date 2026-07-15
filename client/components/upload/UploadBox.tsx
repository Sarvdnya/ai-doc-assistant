"use client";

import { useState } from "react";
import { Upload } from "lucide-react";

import { uploadDocument } from "@/src/services/document.service";

interface UploadBoxProps {
  onUploadSuccess: () => void | Promise<void>;
}

export default function UploadBox({ onUploadSuccess }: UploadBoxProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || isUploading) return;

    const files = Array.from(event.target.files);
    setIsUploading(true);
    setError(null);

    try {
      for (const file of files) {
        await uploadDocument(file);
        await onUploadSuccess();
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Unable to upload the PDF."
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-white">
      <label className="cursor-pointer flex flex-col items-center gap-3">
        <Upload size={40} className="text-gray-500" />

        <h2 className="text-lg font-semibold">
          Upload PDF Files
        </h2>

        <p className="text-gray-500 text-sm">
          {isUploading ? "Uploading PDF files..." : "Click here to choose one or more PDF files"}
        </p>

        <input
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={handleChange}
          disabled={isUploading}
        />
      </label>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
