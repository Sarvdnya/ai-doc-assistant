"use client";

import { useState } from "react";
import type { VideoProject } from "./types";

interface Props {
  project: VideoProject;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

function SceneImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full h-[250px] bg-gray-100 flex items-center justify-center rounded-t-xl">
        <div className="text-center">
          <svg
            className="size-10 text-gray-300 mx-auto mb-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="text-sm text-gray-400 font-medium">No Image Available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[250px] bg-gray-50 relative overflow-hidden rounded-t-xl">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}
      <img
        src={`${API_BASE_URL}/${src}`}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

function CollapsibleSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 hover:text-gray-600 transition-colors"
      >
        <svg
          className={`size-3.5 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {label}
      </button>
      {open && (
        <div className="text-xs text-gray-500 leading-relaxed font-mono bg-gray-50 rounded-lg p-3 border">
          {children}
        </div>
      )}
    </div>
  );
}

export default function Storyboard({ project }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-gray-900">{project.title}</h3>
          <p className="text-sm text-gray-500">
            {project.sceneCount} scenes &middot; {project.duration}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 self-start">
          <span className="size-1.5 rounded-full bg-green-500" />
          Project Ready
        </span>
      </div>

      <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
        {project.scenes.map((scene) => (
          <div
            key={scene.scene}
            className="border rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <SceneImage
              src={scene.imagePath}
              alt={`Scene ${scene.scene}: ${scene.narration}`}
            />

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center size-7 rounded-full bg-blue-600 text-white text-xs font-bold">
                    {scene.scene}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    Scene {scene.scene}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <svg
                    className="size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {scene.duration}s
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Narration
                </p>
                <p className="text-sm text-gray-800 leading-relaxed">
                  {scene.narration}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Visual Description
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {scene.visual}
                </p>
              </div>

              <CollapsibleSection label="Image Prompt">
                {scene.imagePrompt}
              </CollapsibleSection>

              <div className="pt-3 border-t text-xs text-gray-400 truncate" title={scene.imagePath}>
                <span className="font-mono">{scene.imagePath}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
