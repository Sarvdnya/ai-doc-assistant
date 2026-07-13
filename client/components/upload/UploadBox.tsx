"use client";

import { Upload } from "lucide-react";

interface UploadBoxProps {
  onUpload: (files: File[]) => void;
}

export default function UploadBox({ onUpload }: UploadBoxProps) {
const handleChange = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  if (!event.target.files) return;

  const files = Array.from(event.target.files);

  // Keep local preview working
  onUpload(files);

  // Upload each file to the backend
for (const file of files) {
  const formData = new FormData();
  formData.append("pdf", file);

  try {
    console.log("Uploading:", file.name);

    const response = await fetch("http://localhost:5000/api/upload", {
      method: "POST",
      body: formData,
    });

    console.log("Status:", response.status);

    const data = await response.json();

    console.log("Response:", data);
  } catch (err) {
    console.error("Upload Error:", err);
  }
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
          Click here to choose one or more PDF files
        </p>

        <input
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={handleChange}
        />
      </label>
    </div>
  );
}