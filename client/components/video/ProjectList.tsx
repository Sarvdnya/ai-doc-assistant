"use client";

import { useState } from "react";
import type { ProjectSummary } from "./types";

interface Props {
  projects: ProjectSummary[];
  onOpenProject: (project: ProjectSummary) => void;
  onDeleteProject: (id: string) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <svg
        className="size-24 text-gray-200 mb-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <polyline points="9 10 12 13 15 10" />
      </svg>
      <h3 className="text-lg font-semibold text-gray-400 mb-1">
        No Overview Videos Generated Yet
      </h3>
      <p className="text-sm text-gray-300 text-center max-w-sm">
        Generate an overview video from a document, and it will appear here.
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: ProjectSummary["status"] }) {
  if (status === "images_generated") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <span className="size-1.5 rounded-full bg-green-500" />
        Images Ready
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      <span className="size-1.5 rounded-full bg-amber-500" />
      Generated
    </span>
  );
}

function ProjectCard({
  project,
  onOpen,
  onDelete,
}: {
  project: ProjectSummary;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleDelete = () => {
    setConfirming(true);
  };

  const confirmDelete = () => {
    setDeleting(true);
    setConfirming(false);
    onDelete();
  };

  const cancelDelete = () => {
    setConfirming(false);
  };

  const createdDate = new Date(project.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="border rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Thumbnail */}
      <div className="w-full h-44 bg-gray-50 relative overflow-hidden">
        {project.thumbnail ? (
          <img
            src={`${API_BASE_URL}/${project.thumbnail}`}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="size-16 text-gray-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
              <polyline points="9 10 12 13 15 10" />
            </svg>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 flex-1">
            {project.title}
          </h4>
          <StatusBadge status={project.status} />
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {createdDate}
          </span>
          <span className="flex items-center gap-1">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            {project.sceneCount} scenes
          </span>
          <span className="flex items-center gap-1">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {project.duration}
          </span>
        </div>

        {/* Actions */}
        {confirming ? (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-gray-500">Delete this project?</span>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
            >
              {deleting ? "Deleting..." : "Yes, Delete"}
            </button>
            <button
              onClick={cancelDelete}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onOpen}
              className="flex-1 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Open
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectList({
  projects,
  onOpenProject,
  onDeleteProject,
}: Props) {
  if (projects.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onOpen={() => onOpenProject(project)}
          onDelete={() => onDeleteProject(project.id)}
        />
      ))}
    </div>
  );
}
