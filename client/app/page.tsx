"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import AppLayout from "@/components/layout/AppLayout";
import DocumentList from "@/components/document/DocumentList";
import ChatPanel from "@/components/chat/ChatPanel";
import UploadDropzone from "@/components/upload/UploadDropzone";
import { GenerateOverviewButton } from "@/components/video/GenerateOverviewButton";
import ProgressStepper from "@/components/ui/ProgressStepper";

import type { DocumentFile } from "@/components/document/types";
import type { VideoGenerationResult } from "@/src/services/video.service";
import { deleteDocument, getDocuments } from "@/src/services/document.service";

import {
  Download,
  Share2,
  FileText,
  Clock,
  Film,
  Sparkles,
} from "lucide-react";

const PdfViewer = dynamic(() => import("@/components/pdf/PdfViewer"), {
  ssr: false,
});

function videoFromDocument(doc: DocumentFile): VideoGenerationResult | null {
  if (doc.video?.status !== "ready" || !doc.overview || !doc.video.url)
    return null;
  return {
    success: true,
    videoUrl: doc.video.url.startsWith("/")
      ? doc.video.url
      : `/${doc.video.url}`,
    title: doc.overview.title,
    duration: doc.overview.duration,
    sceneCount: doc.overview.sceneCount,
  };
}

export default function Dashboard() {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [directorGenerating, setDirectorGenerating] = useState(false);
  const [cacheBust, setCacheBust] = useState(0);

  const selectedDocument = useMemo(() => {
    if (!selectedId) return null;
    return documents.find((d) => d._id === selectedId) ?? null;
  }, [documents, selectedId]);

  const videoDisplay = selectedDocument
    ? videoFromDocument(selectedDocument)
    : null;

  const videoUrl = useMemo(() => {
    if (!videoDisplay) return null;
    const base = videoDisplay.videoUrl.replace(/^https?:\/\/[^/]+/, "");
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}_cb=${cacheBust}`;
  }, [videoDisplay, cacheBust]);

  const loadDocuments = useCallback(async () => {
    setIsLoadingDocuments(true);
    setDocumentsError(null);

    try {
      const nextDocuments = await getDocuments();
      setDocuments(nextDocuments);
    } catch (error) {
      setDocumentsError(
        error instanceof Error ? error.message : "Unable to load documents."
      );
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  const handleSelectDocument = useCallback((doc: DocumentFile) => {
    setSelectedId(doc._id);
    setCacheBust((k) => k + 1);
  }, []);

  const handleDeleteDocument = useCallback(
    async (id: string) => {
      try {
        await deleteDocument(id);
        if (selectedId === id) {
          setSelectedId(null);
          setCacheBust((k) => k + 1);
        }
        await loadDocuments();
      } catch (error) {
        setDocumentsError(
          error instanceof Error ? error.message : "Unable to delete document."
        );
      }
    },
    [loadDocuments, selectedId]
  );

  const handleDownload = useCallback(async () => {
    const url = videoUrl ?? videoDisplay?.videoUrl;
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "overview.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("[DOWNLOAD] Failed:", err);
      alert(
        "Download failed. Try right-clicking the video and selecting 'Save video as...'."
      );
    }
  }, [videoDisplay, videoUrl]);

  const handleVideoGenerated = useCallback(
    async (result: VideoGenerationResult) => {
      setDocuments((prev) =>
        prev.map((d) =>
          d._id === selectedId
            ? {
                ...d,
                overview: {
                  title: result.title,
                  duration: result.duration,
                  sceneCount: result.sceneCount,
                  generatedAt: new Date().toISOString(),
                },
                video: {
                  status: "ready" as const,
                  url: result.videoUrl,
                  duration: result.duration,
                },
              }
            : d
        )
      );
      setCacheBust((k) => k + 1);
      try {
        const nextDocuments = await getDocuments();
        if (nextDocuments.length) setDocuments(nextDocuments);
      } catch {
        // non-critical — next selection will refetch
      }
    },
    [selectedId]
  );

  /* Initial load on mount */
  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadDocuments();
    }, 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadDocuments]);

  /* Refresh fresh document data whenever the selected document changes */
  useEffect(() => {
    if (!selectedId) return;

    let cancelled = false;

    const refresh = async () => {
      try {
        const docs = await getDocuments();
        if (cancelled) return;
        setDocuments(docs);
      } catch {
        // silent — next interaction will retry
      }
    };

    refresh();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const videoElementKey = `${selectedDocument?._id ?? "none"}-${cacheBust}`;

  return (
    <AppLayout>
      <div className="space-y-6 h-full flex flex-col">
        <UploadDropzone onUploadSuccess={loadDocuments} />

        <ProgressStepper document={selectedDocument} />

        <div className="flex flex-1 gap-6 min-h-0">
          <DocumentList
            documents={documents}
            selectedDocument={selectedDocument}
            onSelectDocument={handleSelectDocument}
            onDeleteDocument={handleDeleteDocument}
            isLoading={isLoadingDocuments}
            error={documentsError}
          />

          <div className="flex-1 min-w-0 pr-1">
            {selectedDocument ? (
              <div className="flex gap-5 h-full">
                <div className="flex-1 glass-card p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      Document Preview
                    </h3>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {selectedDocument.originalName}
                    </span>
                  </div>
                  <div className="flex-1 rounded-xl overflow-hidden bg-[var(--bg-background)]">
                    <PdfViewer document={selectedDocument} />
                  </div>
                </div>

                <div className="flex-1 glass-card p-6 flex flex-col gap-5">
                  {videoDisplay ? (
                    <>
                      <div className="flex items-start justify-between flex-shrink-0">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                            <Film
                              size={20}
                              className="text-[var(--color-primary)]"
                            />
                            {videoDisplay.title}
                          </h3>
                          <div className="flex gap-4 text-sm text-[var(--text-secondary)]">
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} />
                              {videoDisplay.duration}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Film size={14} />
                              {videoDisplay.sceneCount} scenes
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 flex items-center justify-center min-h-0">
                        <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl shadow-[rgba(var(--color-primary-rgb),0.15)] aspect-video w-full">
                          <video
                            key={videoElementKey}
                            controls
                            className="w-full h-full"
                          >
                            <source
                              src={videoUrl ?? undefined}
                              type="video/mp4"
                            />
                          </video>
                        </div>
                      </div>

                      <div className="flex gap-3 flex-wrap flex-shrink-0">
                        <button
                          onClick={handleDownload}
                          className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[rgba(var(--color-primary-rgb),0.25)]"
                        >
                          <Download size={16} />
                          Download MP4
                        </button>
                        <button className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--hover-bg)] hover:scale-[1.02] active:scale-95 transition-all">
                          <Share2 size={16} />
                          Share
                        </button>
                        <GenerateOverviewButton
                          documentId={selectedDocument._id}
                          onVideoGenerated={handleVideoGenerated}
                          disabled={directorGenerating}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="space-y-4 text-center">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto"
                          style={{
                            backgroundColor: `rgba(var(--color-primary-rgb), 0.15)`,
                          }}
                        >
                          <Sparkles
                            size={20}
                            className="text-[var(--color-primary)]"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                            AI Video Overview
                          </h3>
                          <p className="text-sm text-[var(--text-secondary)]">
                            No video generated yet.
                          </p>
                        </div>
                        <GenerateOverviewButton
                          documentId={selectedDocument._id}
                          onVideoGenerated={handleVideoGenerated}
                          disabled={directorGenerating}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-card flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card)] flex items-center justify-center mx-auto border border-[var(--border-color)]">
                    <FileText
                      size={28}
                      className="text-[var(--text-secondary)]"
                    />
                  </div>
                  <div>
                    <p className="text-[var(--text-primary)] font-medium">
                      No Document Selected
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Upload a PDF or select one from the list
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-[420px] flex-shrink-0">
            <ChatPanel
              documentId={selectedDocument?._id}
              onGenerationStateChange={setDirectorGenerating}
              onVideoGenerated={() => void loadDocuments()}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
