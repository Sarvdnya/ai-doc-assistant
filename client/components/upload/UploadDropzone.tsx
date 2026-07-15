"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

import { uploadDocument } from "@/src/services/document.service";

interface UploadDropzoneProps {
  onUploadSuccess: () => void | Promise<void>;
}

type UploadStatus = "idle" | "uploading" | "complete" | "failed";

export default function UploadDropzone({ onUploadSuccess }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const completeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const resetUpload = () => {
    setUploadingFileName(null);
    setUploadProgress(0);
    setUploadStatus("idle");
  };

  const isPdf = (file: File) =>
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  const uploadFiles = async (files: File[]) => {
    const pdfs = files.filter(isPdf);
    if (pdfs.length === 0) return;

    setError(null);

    for (const file of pdfs) {
      setUploadingFileName(file.name);
      setUploadProgress(0);
      setUploadStatus("uploading");

      try {
        await uploadDocument(file, (progress) => {
          setUploadProgress(progress);
        });

        setUploadStatus("complete");
        setUploadProgress(100);

        await onUploadSuccess();

        clearTimeout(completeTimer.current);
        completeTimer.current = setTimeout(resetUpload, 1000);
      } catch (uploadError) {
        setUploadStatus("failed");
        setError(
          uploadError instanceof Error ? uploadError.message : "Unable to upload the PDF."
        );
        return;
      }
    }
  };

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current++;
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    if (uploadStatus === "uploading") return;

    const files = Array.from(event.dataTransfer.files);
    void uploadFiles(files);
  };

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || uploadStatus === "uploading") return;

    const files = Array.from(event.target.files);
    event.target.value = "";
    await uploadFiles(files);
  };

  const handleClick = () => {
    if (uploadStatus === "uploading") return;
    inputRef.current?.click();
  };

  const isUploading = uploadStatus === "uploading";

  return (
    <div
      role="button"
      tabIndex={isUploading ? -1 : 0}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && !isUploading) handleClick();
      }}
      className={[
        "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer",
        "transition-all duration-200 ease-in-out",
        isDragging
          ? "border-2 border-dashed border-blue-500 bg-blue-50 shadow-lg scale-[1.01]"
          : "border-2 border-dashed border-gray-300 bg-white hover:bg-gray-50",
      ].join(" ")}
    >
      <div className="flex flex-col items-center gap-3 pointer-events-none">
        <Upload size={40} className="text-gray-500" />

        {uploadStatus === "uploading" && (
          <div className="w-full max-w-xs flex flex-col items-center gap-2">
            <p className="text-sm text-gray-700 truncate max-w-full">
              Uploading {uploadingFileName}
            </p>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{uploadProgress}%</p>
          </div>
        )}

        {uploadStatus === "complete" && (
          <div className="w-full max-w-xs flex flex-col items-center gap-2">
            <p className="text-sm text-green-600 font-medium">
              &#10003; Upload Complete
            </p>
          </div>
        )}

        {uploadStatus === "failed" && (
          <div className="w-full max-w-xs flex flex-col items-center gap-2">
            <p className="text-sm text-red-600 font-medium">
              &#10007; Upload Failed
            </p>
          </div>
        )}

        {uploadStatus === "idle" && (
          <>
            <h2 className="text-lg font-semibold">
              Upload PDF Files
            </h2>
            <p className="text-gray-500 text-sm">
              Click here to choose one or drop PDF files here
            </p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={handleChange}
        disabled={isUploading}
      />

      {error && uploadStatus === "idle" && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
