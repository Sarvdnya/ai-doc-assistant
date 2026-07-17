"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

import AppLayout from "@/components/layout/AppLayout";
import DocumentList from "@/components/document/DocumentList";
import ChatPanel from "@/components/chat/ChatPanel";
import UploadDropzone from "@/components/upload/UploadDropzone";
import GenerateOverviewButton from "@/components/video/GenerateOverviewButton";
import Storyboard from "@/components/video/Storyboard";
import ProjectList from "@/components/video/ProjectList";

import type { DocumentFile } from "@/components/document/types";
import type { VideoProject, ProjectSummary } from "@/components/video/types";
import { deleteDocument, getDocuments } from "@/src/services/document.service";
import { getProjects, getProjectById, deleteProject as deleteProjectApi } from "@/src/services/video.service";

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
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [showProjects, setShowProjects] = useState(false);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [projectsError, setProjectsError] = useState<string | null>(null);

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

    const loadProjects = useCallback(async () => {
        setProjectsLoading(true);
        setProjectsError(null);

        try {
            const list = await getProjects();
            setProjects(list);
        } catch (error) {
            setProjectsError(
                error instanceof Error ? error.message : "Unable to load projects."
            );
        } finally {
            setProjectsLoading(false);
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

    const handleVideoGenerated = useCallback(async (project: VideoProject) => {
        setVideoProject(project);
        await loadProjects();
    }, [loadProjects]);

    const handleOpenProject = useCallback(async (summary: ProjectSummary) => {
        try {
            const project = await getProjectById(summary.id);
            setVideoProject(project);
        } catch (error) {
            setProjectsError(
                error instanceof Error ? error.message : "Unable to load project."
            );
        }
    }, []);

    const handleDeleteProject = useCallback(async (id: string) => {
        try {
            await deleteProjectApi(id);
            // Clear storyboard if it was showing the deleted project
            setVideoProject((current) =>
                current && current.projectId === id ? null : current
            );
            await loadProjects();
        } catch (error) {
            setProjectsError(
                error instanceof Error ? error.message : "Unable to delete project."
            );
        }
    }, [loadProjects]);

    useEffect(() => {
        const loadTimer = window.setTimeout(() => {
            void loadDocuments();
            void loadProjects();
        }, 0);

        return () => window.clearTimeout(loadTimer);
    }, [loadDocuments, loadProjects]);

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

                            {/* Video Projects Toggle */}
                            <div className="bg-white rounded-xl border">
                                <button
                                    onClick={() => setShowProjects(!showProjects)}
                                    className="w-full flex items-center justify-between p-4 text-left"
                                >
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                        Video Projects
                                        {projects.length > 0 && (
                                            <span className="ml-2 text-xs font-normal text-gray-400">
                                                ({projects.length})
                                            </span>
                                        )}
                                    </h3>
                                    <svg
                                        className={`size-4 text-gray-400 transition-transform duration-200 ${showProjects ? "rotate-180" : ""}`}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>

                                {showProjects && (
                                    <div className="border-t px-4 pb-4 pt-3">
                                        {projectsLoading ? (
                                            <div className="flex items-center justify-center py-10">
                                                <svg className="animate-spin size-6 text-gray-300" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                                </svg>
                                            </div>
                                        ) : projectsError ? (
                                            <p className="text-sm text-red-500">{projectsError}</p>
                                        ) : (
                                            <ProjectList
                                                projects={projects}
                                                onOpenProject={handleOpenProject}
                                                onDeleteProject={handleDeleteProject}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            {videoProject && (
                                <div className="bg-white rounded-xl border p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-base font-semibold text-gray-700 uppercase tracking-wider">
                                            Storyboard
                                        </h2>
                                        <button
                                            onClick={() => setVideoProject(null)}
                                            className="text-xs text-gray-400 hover:text-gray-600 transition"
                                        >
                                            Close
                                        </button>
                                    </div>
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
