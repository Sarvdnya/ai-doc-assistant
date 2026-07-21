"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2, CheckCircle2, XCircle } from "lucide-react";

import { uploadDocument } from "@/src/services/document.service";

interface UploadDropzoneProps {
  onUploadSuccess: () => void | Promise<void>;
}

type UploadStatus = "idle" | "uploading" | "complete" | "failed";

export default function UploadDropzone({
  onUploadSuccess,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const completeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(
    null
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const resetUpload = () => {
    setUploadingFileName(null);
    setUploadProgress(0);
    setUploadStatus("idle");
  };

  const isPdf = (file: File) =>
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  const uploadFiles = async (files: File[]) => {
    const nonPdfs = files.filter((f) => !isPdf(f));
    if (nonPdfs.length > 0) {
      setError("Only PDF files are allowed.");
      return;
    }

    setError(null);

    for (const file of files) {
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
        completeTimer.current = setTimeout(resetUpload, 2000);
      } catch (uploadError) {
        setUploadStatus("failed");
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Unable to upload the PDF."
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
    <motion.div
      role="button"
      tabIndex={isUploading ? -1 : 0}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (
          (event.key === "Enter" || event.key === " ") &&
          !isUploading
        )
          handleClick();
      }}
      animate={{
        scale: isDragging ? 1.005 : 1,
        borderColor: isDragging
          ? `rgba(var(--color-primary-rgb), 0.5)`
          : "var(--border-color)",
      }}
      className={`
        border-2 border-dashed rounded-[18px] p-8 text-center cursor-pointer
        transition-colors duration-300 backdrop-blur-xl
        ${
          isDragging
            ? "shadow-lg"
            : "hover:bg-[var(--bg-card)]"
        }
      `}
      style={{
        backgroundColor: isDragging
          ? `rgba(var(--color-primary-rgb), 0.08)`
          : `color-mix(in srgb, var(--bg-surface) 80%, transparent)`,
        boxShadow: isDragging
          ? `0 8px 32px rgba(var(--color-primary-rgb), 0.12)`
          : "none",
      }}
    >
      <div className="flex flex-col items-center gap-4 pointer-events-none">
        <AnimatePresence mode="wait">
          {uploadStatus === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center border"
                style={{
                  backgroundColor: `rgba(var(--color-primary-rgb), 0.12)`,
                  borderColor: `rgba(var(--color-primary-rgb), 0.2)`,
                }}
              >
                <Upload
                  size={28}
                  className="text-[var(--color-primary)]"
                />
              </div>
              <div>
                <p className="text-lg font-semibold text-[var(--text-primary)]">
                  Upload PDF Document
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Drag & drop or click to browse PDF files
                </p>
              </div>
            </motion.div>
          )}

          {uploadStatus === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-md flex flex-col items-center gap-3"
            >
              <Loader2
                size={28}
                className="text-[var(--color-primary)] animate-spin"
              />
              <p className="text-sm text-[var(--text-primary)] truncate max-w-full">
                {uploadingFileName}
              </p>
              <div className="w-full h-2 bg-[var(--bg-card)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: "var(--color-primary)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                {uploadProgress}%
              </p>
            </motion.div>
          )}

          {uploadStatus === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `rgba(var(--color-success-rgb), 0.15)`,
                }}
              >
                <CheckCircle2
                  size={28}
                  className="text-[var(--color-success)]"
                />
              </div>
              <p className="text-sm font-medium text-[var(--color-success)]">
                Upload Complete
              </p>
            </motion.div>
          )}

          {uploadStatus === "failed" && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `rgba(var(--color-danger-rgb), 0.15)`,
                }}
              >
                <XCircle
                  size={28}
                  className="text-[var(--color-danger)]"
                />
              </div>
              <p className="text-sm font-medium text-[var(--color-danger)]">
                Upload Failed
              </p>
            </motion.div>
          )}
        </AnimatePresence>
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
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-sm text-[var(--color-danger)]"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}
