"use client";

import { useState } from "react";

import AppLayout from "@/components/layout/AppLayout";
import DocumentList from "@/components/document/DocumentList";
import ChatPanel from "@/components/chat/ChatPanel";
import PdfViewer from "@/components/pdf/PdfViewer";
import UploadBox from "@/components/upload/UploadBox";

import type { DocumentFile } from "@/components/document/types";

export default function Dashboard() {
    const [documents, setDocuments] = useState<DocumentFile[]>([]);

    const [selectedDocument, setSelectedDocument] =
        useState<DocumentFile | null>(null);

    const handleUpload = (files: File[]) => {
        const uploadedDocs: DocumentFile[] = files.map((file) => ({
            id: crypto.randomUUID(),
            name: file.name,
            file,
            url: URL.createObjectURL(file),
        }));

        setDocuments((prev) => [...prev, ...uploadedDocs]);
    };

    return (
        <AppLayout>
            <div className="p-4">
                <UploadBox onUpload={handleUpload} />
            </div>

            <div className="flex flex-1 text-black">
                <DocumentList
                    documents={documents}
                    selectedDocument={selectedDocument}
                    onSelectDocument={setSelectedDocument}
                />

                <main className="flex-1 bg-gray-50 p-6">
                    <div className="flex gap-10 h-full">
                        <div className="w-[700px] h-[500px]">
                            <PdfViewer document={selectedDocument} />
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