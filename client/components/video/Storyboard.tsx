"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, ChevronRight, Image, FileText, Volume2 } from "lucide-react";
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
      <div
        className="w-full h-[200px] flex items-center justify-center rounded-t-[18px]"
        style={{ backgroundColor: "var(--bg-card)" }}
      >
        <div className="text-center">
          <Image size={28} className="text-[var(--text-secondary)]/50 mx-auto mb-2" />
          <p className="text-sm text-[var(--text-secondary)]/50 font-medium">
            No Image Available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[200px] bg-[var(--bg-background)] relative overflow-hidden rounded-t-[18px]">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse" style={{ backgroundColor: "var(--bg-card)" }} />
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
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ChevronRight
          size={12}
          className={`transition-transform duration-200 ${
            open ? "rotate-90" : ""
          }`}
        />
        <Icon size={12} />
        {label}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed font-mono rounded-xl p-3 border"
          style={{
            backgroundColor: "var(--bg-background)",
            borderColor: "var(--border-light)",
          }}
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

export default function Storyboard({ project }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-[var(--text-primary)]">
            {project.title}
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {project.sceneCount} scenes · {project.duration}
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border self-start"
          style={{
            backgroundColor: `rgba(var(--color-success-rgb), 0.15)`,
            color: "var(--color-success)",
            borderColor: `rgba(var(--color-success-rgb), 0.15)`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "var(--color-success)" }}
          />
          Project Ready
        </span>
      </div>

      <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
        {project.scenes.map((scene, index) => (
          <motion.div
            key={scene.scene}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="backdrop-blur-xl border border-[var(--border-color)] rounded-[18px] overflow-hidden hover:border-[var(--hover-border)] transition-all duration-300 hover:shadow-xl"
            style={{
              backgroundColor: "var(--glass-bg)",
              boxShadow: `0 4px 6px rgba(var(--color-primary-rgb), 0.03)`,
            }}
          >
            <SceneImage
              src={scene.imagePath}
              alt={`Scene ${scene.scene}: ${scene.narration}`}
            />

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold"
                    style={{
                      background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
                    }}
                  >
                    {scene.scene}
                  </span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    Scene {scene.scene}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                  <Clock size={12} />
                  {scene.duration}s
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Volume2 size={12} />
                  Narration
                </p>
                <p className="text-sm text-[var(--text-message)] leading-relaxed">
                  {scene.narration}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <FileText size={12} />
                  Visual
                </p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {scene.visual}
                </p>
              </div>

              <CollapsibleSection label="Image Prompt" icon={Image}>
                {scene.imagePrompt}
              </CollapsibleSection>

              <div className="pt-3 border-t border-[var(--border-light)] text-xs text-[var(--text-secondary)]/50 truncate">
                <span className="font-mono">{scene.imagePath}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
