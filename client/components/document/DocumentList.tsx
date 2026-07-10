"use client";

import { useState } from "react";
import { Search, Upload, FileText } from "lucide-react";

export default function DocumentList({ selectedDocument, onSelectDocument }: { selectedDocument: string | null; onSelectDocument: (doc: string) => void }) {

    const [documents, setDocuments] = useState([
        "iPhone 16 Features.pdf",
        "Project Report.pdf",
        "Resume.pdf",
    ]);


    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {

        const file = e.target.files?.[0];

        if (file) {
            setDocuments((prev) => [
                ...prev,
                file.name
            ]);
        }

    };


    return (
        <div className="w-72 bg-white border-r p-4 text-black flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">

                <h2 className="text-lg font-semibold">
                    Documents
                </h2>


                {/* Upload Button */}
                <label
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-200 text-black cursor-pointer hover:bg-gray-300"
                >
                    <Upload size={18} />

                    <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={handleUpload}
                    />

                </label>

            </div>


            {/* Search */}
            <div className="flex items-center border rounded-lg px-3 py-2 mb-4 cursor-text hover:bg-gray-200">

                <Search size={18} className="text-gray-500" />

                <input
                    type="text"
                    placeholder="Search documents..."
                    className="ml-2 w-full outline-none text-black placeholder-gray-500"
                />

            </div>



            {/* Document List */}
            <div className="space-y-1">
                {documents.map((doc, index) => (
                    <div
                        key={index}
                        onClick={() => onSelectDocument(doc)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition ${selectedDocument === doc
                                ? "bg-blue-100 border border-blue-400"
                                : "hover:bg-gray-100"
                            }`}
                    >
                        <FileText size={20} />

                        <span className="text-sm">{doc}</span>
                    </div>
                ))}
            </div>

        </div>


    );
}