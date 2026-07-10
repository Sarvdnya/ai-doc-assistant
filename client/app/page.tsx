"use client";

import { useState } from "react";

import AppLayout from "@/components/layout/AppLayout";
import DocumentList from "@/components/document/DocumentList";
import ChatPanel from "@/components/chat/ChatPanel";
import PdfViewer from "@/components/pdf/PdfViewer";

export default function Dashboard() {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  return (
    <AppLayout>
      <div className="flex flex-1 text-black">
        <DocumentList
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