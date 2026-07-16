"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

import AppLayout from "@/components/layout/AppLayout";
import DocumentList from "@/components/document/DocumentList";
import ChatPanel from "@/components/chat/ChatPanel";
import UploadDropzone from "@/components/upload/UploadDropzone";
import GenerateOverviewButton from "@/components/video/GenerateOverviewButton";
import Storyboard from "@/components/video/Storyboard";

import type { DocumentFile } from "@/components/document/types";
import type { VideoProject } from "@/components/video/types";
import { deleteDocument, getDocuments } from "@/src/services/document.service";

// pdf.js depends on browser-only APIs such as DOMMatrix, so it must not be
// evaluated while Next.js renders this page on the server.
const PdfViewer = dynamic(() => import("@/components/pdf/PdfViewer"), {
    ssr: false,
});

export default function Dashboard() {
    const [documents, setDocuments] = useState<DocumentFile[]>([]);

    const [selectedDocument, setSelectedDocument] =
        useState<DocumentFile | null>(null);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
    const [documentsError, setDocumentsError] = useState<string | null>(null);

    const [videoProject, setVideoProject] = useState<VideoProject | null>(null);

    const loadDocuments = useCallback(async () => {
        setIsLoadingDocuments(true);
        setDocumentsError(null);

        try {
            const nextDocuments = await getDocuments();
            setDocuments(nextDocuments);
            setSelectedDocument((current) =>
                current
                    ? nextDocuments.find((document) => document._id === current._id) ?? null
                    : null
            );
        } catch (error) {
            setDocumentsError(
                error instanceof Error ? error.message : "Unable to load documents."
            );
        } finally {
            setIsLoadingDocuments(false);
        }
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

    const handleVideoGenerated = useCallback((project: VideoProject) => {
        setVideoProject(project);
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
                    onSelectDocument={setSelectedDocument}
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
                                    <GenerateOverviewButton
                                        documentId={selectedDocument._id}
                                        onVideoGenerated={handleVideoGenerated}
                                    />
                                </div>
                            )}

                            {videoProject && (
                                <div className="bg-white rounded-xl border p-6">
                                    <h2 className="text-base font-semibold text-gray-700 uppercase tracking-wider mb-4">
                                        Storyboard
                                    </h2>
                                    <Storyboard project={videoProject} />
                                </div>
                            )}
                        </div>

                        <div className="w-[450px] h-[500px]">
                            <ChatPanel />
                        </div>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}
