"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import AppLayout from "@/components/layout/AppLayout";
import DocumentList from "@/components/document/DocumentList";
import ChatPanel from "@/components/chat/ChatPanel";
import UploadDropzone from "@/components/upload/UploadDropzone";
import { GenerateOverviewButton } from "@/components/video/GenerateOverviewButton";

import type { DocumentFile } from "@/components/document/types";
import type { VideoGenerationResult } from "@/src/services/video.service";
import { deleteDocument, getDocuments } from "@/src/services/document.service";

const PdfViewer = dynamic(() => import("@/components/pdf/PdfViewer"), {
    ssr: false,
});

function videoFromDocument(doc: DocumentFile): VideoGenerationResult | null {
    if (doc.video?.status !== "ready" || !doc.overview || !doc.video.url) return null;
    return {
        success: true,
        videoUrl: doc.video.url.startsWith("/") ? doc.video.url : `/${doc.video.url}`,
        title: doc.overview.title,
        duration: doc.overview.duration,
        sceneCount: doc.overview.sceneCount,
    };
}

export default function Dashboard() {
    const [documents, setDocuments] = useState<DocumentFile[]>([]);

    const [selectedDocument, setSelectedDocument] =
        useState<DocumentFile | null>(null);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
    const [documentsError, setDocumentsError] = useState<string | null>(null);
    const [directorGenerating, setDirectorGenerating] = useState(false);

    const videoDisplay = selectedDocument
        ? videoFromDocument(selectedDocument)
        : null;
    const videoUrl = useMemo(
        () => (videoDisplay ? videoDisplay.videoUrl.replace(/^https?:\/\/[^/]+/, "") : null),
        [videoDisplay]
    );

    const loadDocuments = useCallback(async () => {
        setIsLoadingDocuments(true);
        setDocumentsError(null);

        try {
            const nextDocuments = await getDocuments();
            setDocuments(nextDocuments);
            setSelectedDocument((current) => {
                const updated = current
                    ? nextDocuments.find((document) => document._id === current._id) ?? null
                    : null;
                return updated;
            });
        } catch (error) {
            setDocumentsError(
                error instanceof Error ? error.message : "Unable to load documents."
            );
        } finally {
            setIsLoadingDocuments(false);
        }
    }, []);

    const handleSelectDocument = useCallback((doc: DocumentFile) => {
        setSelectedDocument(doc);
    }, []);

    const handleDeleteDocument = useCallback(async (id: string) => {
        try {
            await deleteDocument(id);
            await loadDocuments();
        } catch (error) {
            setDocumentsError(
                error instanceof Error ? error.message : "Unable to delete document."
            );
        }
    }, [loadDocuments]);

    const handleDownload = useCallback(async () => {
        if (!videoDisplay?.videoUrl) return;
        try {
            const response = await fetch(videoDisplay.videoUrl);
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
            alert("Download failed. Try right-clicking the video and selecting 'Save video as...'.");
        }
    }, [videoDisplay]);

    const handleVideoGenerated = useCallback(async (result: VideoGenerationResult) => {
        setSelectedDocument((current) => {
            if (!current) return current;
            return {
                ...current,
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
            };
        });
        try {
            const nextDocuments = await getDocuments();
            if (nextDocuments.length) setDocuments(nextDocuments);
        } catch {
            // non-critical — next selection will refetch
        }
    }, []);

    useEffect(() => {
        const loadTimer = window.setTimeout(() => {
            void loadDocuments();
        }, 0);

        return () => window.clearTimeout(loadTimer);
    }, [loadDocuments]);

    return (
        <AppLayout>
            <div className="p-4">
                <UploadDropzone onUploadSuccess={loadDocuments} />
            </div>

            <div className="flex flex-1 text-black">
                <DocumentList
                    documents={documents}
                    selectedDocument={selectedDocument}
                    onSelectDocument={handleSelectDocument}
                    onDeleteDocument={handleDeleteDocument}
                    isLoading={isLoadingDocuments}
                    error={documentsError}
                />

                <main className="flex-1 bg-gray-50 p-6 overflow-y-auto">
                    <div className="flex gap-10">
                        <div className="w-[700px] space-y-6">
                            <div className="h-[500px]">
                                <PdfViewer document={selectedDocument} />
                            </div>

                            {selectedDocument && (
                                <div className="bg-white rounded-xl border p-4">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                        Video Overview
                                    </h3>
                                    {videoDisplay ? (
                                        <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Video ready — scroll down to view
                                        </div>
                                    ) : (
                                        <GenerateOverviewButton
                                            documentId={selectedDocument._id}
                                            onVideoGenerated={handleVideoGenerated}
                                            disabled={directorGenerating}
                                        />
                                    )}
                                </div>
                            )}

                            {videoDisplay && (
                                <div className="bg-white rounded-xl border p-6 space-y-4">
                                    <h2 className="text-lg font-semibold text-gray-800">
                                        {videoDisplay.title}
                                    </h2>

                                    <div className="flex gap-4 text-sm text-gray-500">
                                        <span>Duration: {videoDisplay.duration}</span>
                                        <span>Scenes: {videoDisplay.sceneCount}</span>
                                    </div>

                                    <video
                                        controls
                                        className="w-full rounded-lg bg-black"
                                        style={{ maxHeight: 400 }}
                                    >
                                        <source src={videoUrl ?? undefined} type="video/mp4" />
                                    </video>

                                    <button
                                        onClick={handleDownload}
                                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Download MP4
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="w-[450px] h-[500px]">
                            <ChatPanel
                                documentId={selectedDocument?._id}
                                onGenerationStateChange={setDirectorGenerating}
                                onVideoGenerated={() => void loadDocuments()}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}
