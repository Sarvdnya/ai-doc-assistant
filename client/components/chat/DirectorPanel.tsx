"use client";

import { useRef, useState } from "react";
import {
  DEFAULT_VIDEO_SETTINGS,
  getDirectorVideoGenerationJob,
  loadVideoGenerationSettings,
  saveVideoGenerationSettings,
  sendDirectorMessage,
  startDirectorVideoGeneration,
} from "@/src/services/director.service";
import type { VideoSettings } from "@/src/services/director.service";
import { SendHorizonal, Sparkles, Settings2 } from "lucide-react";

interface DirectorMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let msgId = 0;
function nextId(): string {
  msgId += 1;
  return `dir-${msgId}`;
}

interface DirectorPanelProps {
  documentId?: string | null;
  onGenerationStateChange?: (generating: boolean) => void;
  onVideoGenerated?: () => void;
}

function SettingRow({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | undefined;
}) {
  if (value === undefined || value === null) return null;
  const display =
    typeof value === "boolean" ? (value ? "On" : "Off") : String(value);
  return (
    <div className="flex justify-between text-xs">
      <span className="text-[var(--text-secondary)]">{label}:</span>
      <span className="text-[var(--text-primary)] font-medium">{display}</span>
    </div>
  );
}

function productionAction(
  message: string
): "full" | "images" | "narration" | "render" | null {
  if (/\b(regenerate|rebuild)\b.*\b(narration|audio|voice)\b/i.test(message))
    return "narration";
  if (/\b(regenerate|rebuild)\b.*\b(images?|visuals?)\b/i.test(message))
    return "images";
  if (/\b(rebuild|render)\b.*\b(final|video)\b/i.test(message))
    return "render";
  if (isGenerationCommand(message)) return "full";
  return null;
}

function isGenerationCommand(message: string): boolean {
  return /\b(generate|create|build|make|start|render|produce)\b.*\b(video|overview|presentation|animated|final)\b|\bmake this into a video\b/i.test(
    message
  );
}

function settingUpdates(
  previous: VideoSettings,
  next: VideoSettings
): string[] {
  const labels: Record<keyof VideoSettings, string> = {
    duration: "Duration",
    sceneCount: "Scenes",
    imageStyle: "Image Style",
    voice: "Voice",
    narrationStyle: "Narration",
    audience: "Audience",
    language: "Language",
    subtitles: "Subtitles",
    backgroundMusic: "Background Music",
    transitions: "Transitions",
    aspectRatio: "Aspect Ratio",
  };
  return (Object.keys(labels) as Array<keyof VideoSettings>).flatMap(
    (key) =>
      next[key] !== undefined && next[key] !== previous[key]
        ? [
            `**${labels[key]}** → ${
              next[key] === true
                ? "On"
                : next[key] === false
                  ? "Off"
                  : next[key]
            }`,
          ]
        : []
  );
}

export default function DirectorPanel({
  documentId,
  onGenerationStateChange,
  onVideoGenerated,
}: DirectorPanelProps) {
  const [messages, setMessages] = useState<DirectorMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<VideoSettings>(() =>
    typeof window !== "undefined"
      ? loadVideoGenerationSettings()
      : DEFAULT_VIDEO_SETTINGS
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addAssistantMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "assistant", content },
    ]);
    setTimeout(scrollToBottom, 50);
  };

  const runVideoGeneration = async (
    action: "full" | "images" | "narration" | "render" = "full"
  ) => {
    if (!documentId) {
      addAssistantMessage("Please upload a PDF first.");
      return;
    }
    setLoading(true);
    onGenerationStateChange?.(true);
    try {
      const jobId = await startDirectorVideoGeneration(
        documentId,
        settings,
        action
      );
      let shownProgress = 0;
      while (true) {
        const job = await getDirectorVideoGenerationJob(jobId);
        for (const progress of job.progress.slice(shownProgress))
          addAssistantMessage(progress);
        shownProgress = job.progress.length;
        if (job.status === "completed") {
          onVideoGenerated?.();
          return;
        }
        if (job.status === "failed")
          throw new Error(job.error ?? "Video generation failed.");
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
      }
    } catch (error) {
      addAssistantMessage(
        error instanceof Error ? error.message : "Video generation failed."
      );
    } finally {
      setLoading(false);
      onGenerationStateChange?.(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");

    const userMsg: DirectorMessage = {
      id: nextId(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setTimeout(scrollToBottom, 50);

    setLoading(true);

    try {
      const data = await sendDirectorMessage(text);
      const updatedSettings = saveVideoGenerationSettings({
        ...settings,
        ...data.settings,
      });
      settingUpdates(settings, updatedSettings).forEach(addAssistantMessage);
      setSettings(updatedSettings);
      const action = productionAction(text);
      if (action) {
        setLoading(false);
        await runVideoGeneration(action);
        return;
      }
      if (!Object.keys(data.settings).length)
        addAssistantMessage("✓ Instruction recorded");
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : "Something went wrong.";
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", content: errMsg },
      ]);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void handleSend();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Settings Summary */}
      <div
        className="rounded-xl p-3 mb-3 border"
        style={{
          backgroundColor: `color-mix(in srgb, var(--bg-card) 100%, transparent)`,
          borderColor: "var(--border-light)",
        }}
      >
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="flex items-center justify-between w-full"
        >
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
            <Settings2 size={12} />
            Settings
          </span>
          <span
            className={`text-[var(--text-secondary)] text-xs transition-transform ${
              settingsOpen ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>
        {settingsOpen && (
          <div className="mt-2 pt-2 border-t border-[var(--border-light)] grid grid-cols-2 gap-x-4 gap-y-1.5">
            <SettingRow label="Duration" value={settings.duration} />
            <SettingRow label="Scenes" value={settings.sceneCount} />
            <SettingRow label="Image Style" value={settings.imageStyle} />
            <SettingRow label="Voice" value={settings.voice} />
            <SettingRow label="Language" value={settings.language} />
            <SettingRow label="Audience" value={settings.audience} />
            <SettingRow label="Subtitles" value={settings.subtitles} />
            <SettingRow
              label="Music"
              value={
                settings.backgroundMusic !== undefined
                  ? !settings.backgroundMusic
                  : undefined
              }
            />
            <SettingRow label="Transitions" value={settings.transitions} />
            <SettingRow label="Aspect Ratio" value={settings.aspectRatio} />
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        className="flex-1 rounded-xl p-4 border overflow-y-auto space-y-3"
        style={{
          backgroundColor: `color-mix(in srgb, var(--bg-card) 40%, transparent)`,
          borderColor: "var(--border-light)",
        }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
            <Sparkles
              size={24}
              className="text-[var(--color-primary)]/50"
            />
            <p className="text-[var(--text-secondary)] text-sm">
              Tell AI what video to create
            </p>
            <p className="text-[var(--text-secondary)]/60 text-xs">
              Try: &ldquo;Create a 90-second educational video&rdquo;
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "user" ? (
              <div className="flex justify-end">
                <div
                  className="text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%] whitespace-pre-wrap text-sm shadow-lg"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    boxShadow: `0 4px 14px rgba(var(--color-primary-rgb), 0.2)`,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div
                  className="border rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[85%] whitespace-pre-wrap text-sm"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-message)",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="border rounded-2xl rounded-bl-sm px-4 py-3"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-color)",
              }}
            >
              <span className="text-[var(--text-secondary)] text-sm">
                Processing
              </span>
              <span className="inline-flex ml-1.5">
                <span className="animate-bounce mx-[1px] size-1.5 bg-[var(--color-primary)] rounded-full [animation-delay:0ms]" />
                <span className="animate-bounce mx-[1px] size-1.5 bg-[var(--color-primary)] rounded-full [animation-delay:150ms]" />
                <span className="animate-bounce mx-[1px] size-1.5 bg-[var(--color-primary)] rounded-full [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 space-y-2">
        <p className="text-xs text-[var(--text-secondary)]/60 px-1">
          Examples: Create a 90 second video · Use realistic images · Generate
          only 6 scenes · Use female narration
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your video..."
            disabled={loading}
            className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--color-primary)]/50 focus:ring-1 focus:ring-[var(--color-primary)]/20 disabled:opacity-50 transition-all"
          />

          <button
            onClick={() => void handleSend()}
            disabled={loading || !input.trim()}
            className="text-white px-4 rounded-xl py-2.5 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all shadow-lg flex items-center"
            style={{
              backgroundColor: "var(--color-primary)",
              boxShadow: `0 4px 14px rgba(var(--color-primary-rgb), 0.25)`,
            }}
          >
            <SendHorizonal size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
