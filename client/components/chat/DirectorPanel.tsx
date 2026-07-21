"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_VIDEO_SETTINGS, getDirectorVideoGenerationJob, loadVideoGenerationSettings, saveVideoGenerationSettings, sendDirectorMessage, startDirectorVideoGeneration } from "@/src/services/director.service";
import type { VideoSettings } from "@/src/services/director.service";

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

function SettingRow({ label, value }: { label: string; value: string | number | boolean | undefined }) {
  if (value === undefined || value === null) return null;
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}:</span>
      <span className="text-gray-800 font-medium">{display}</span>
    </div>
  );
}

function productionAction(message: string): "full" | "images" | "narration" | "render" | null {
  if (/\b(regenerate|rebuild)\b.*\b(narration|audio|voice)\b/i.test(message)) return "narration";
  if (/\b(regenerate|rebuild)\b.*\b(images?|visuals?)\b/i.test(message)) return "images";
  if (/\b(rebuild|render)\b.*\b(final|video)\b/i.test(message)) return "render";
  if (isGenerationCommand(message)) return "full";
  return null;
}

function isGenerationCommand(message: string): boolean {
  return /\b(generate|create|build|make|start|render|produce)\b.*\b(video|overview|presentation|animated|final)\b|\bmake this into a video\b/i.test(message);
}

function settingUpdates(previous: VideoSettings, next: VideoSettings): string[] {
  const labels: Record<keyof VideoSettings, string> = {
    duration: "Duration", sceneCount: "Scenes", imageStyle: "Image Style", voice: "Voice",
    narrationStyle: "Narration", audience: "Audience", language: "Language", subtitles: "Subtitles",
    backgroundMusic: "Background Music", transitions: "Transitions", aspectRatio: "Aspect Ratio",
  };
  return (Object.keys(labels) as Array<keyof VideoSettings>).flatMap((key) =>
    next[key] !== undefined && next[key] !== previous[key]
      ? [`✓ ${labels[key]} → ${next[key] === true ? "On" : next[key] === false ? "Off" : next[key]}`]
      : []
  );
}

export default function DirectorPanel({ documentId, onGenerationStateChange, onVideoGenerated }: DirectorPanelProps) {
  const [messages, setMessages] = useState<DirectorMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  // Keep the server and first browser render identical; local storage is read after hydration.
  const [settings, setSettings] = useState<VideoSettings>(DEFAULT_VIDEO_SETTINGS);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSettings(loadVideoGenerationSettings());
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addAssistantMessage = (content: string) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "assistant", content }]);
    setTimeout(scrollToBottom, 50);
  };

  const runVideoGeneration = async (action: "full" | "images" | "narration" | "render" = "full") => {
    if (!documentId) {
      addAssistantMessage("Please upload a PDF first.");
      return;
    }
    setLoading(true);
    onGenerationStateChange?.(true);
    try {
      const jobId = await startDirectorVideoGeneration(documentId, settings, action);
      let shownProgress = 0;
      while (true) {
        const job = await getDirectorVideoGenerationJob(jobId);
        for (const progress of job.progress.slice(shownProgress)) addAssistantMessage(progress);
        shownProgress = job.progress.length;
        if (job.status === "completed") {
          onVideoGenerated?.();
          return;
        }
        if (job.status === "failed") throw new Error(job.error ?? "Video generation failed.");
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
      }
    } catch (error) {
      addAssistantMessage(error instanceof Error ? error.message : "Video generation failed.");
    } finally {
      setLoading(false);
      onGenerationStateChange?.(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");

    const userMsg: DirectorMessage = { id: nextId(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setTimeout(scrollToBottom, 50);

    setLoading(true);

    try {
      const data = await sendDirectorMessage(text);
      const updatedSettings = saveVideoGenerationSettings({ ...settings, ...data.settings });
      settingUpdates(settings, updatedSettings).forEach(addAssistantMessage);
      setSettings(updatedSettings);
      const action = productionAction(text);
      if (action) {
        setLoading(false);
        await runVideoGeneration(action);
        return;
      }
      if (!Object.keys(data.settings).length) addAssistantMessage("✓ Instruction recorded");
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Something went wrong.";
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
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-3 grid grid-cols-2 gap-x-4 gap-y-1">
          <SettingRow label="Duration" value={settings.duration} />
          <SettingRow label="Scenes" value={settings.sceneCount} />
          <SettingRow label="Image Style" value={settings.imageStyle} />
          <SettingRow label="Voice" value={settings.voice} />
          <SettingRow label="Language" value={settings.language} />
          <SettingRow label="Audience" value={settings.audience} />
          <SettingRow label="Subtitles" value={settings.subtitles} />
          <SettingRow label="Music" value={settings.backgroundMusic !== undefined ? !settings.backgroundMusic : undefined} />
          <SettingRow label="Transitions" value={settings.transitions} />
          <SettingRow label="Aspect Ratio" value={settings.aspectRatio} />
      </div>

      <div className="flex-1 border rounded-lg p-4 bg-gray-50 overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-8 text-sm">
            Tell AI what video to create or update.
          </p>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "user" ? (
              <div className="flex justify-end">
                <div className="bg-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%] whitespace-pre-wrap text-sm">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[85%] whitespace-pre-wrap shadow-sm text-sm">
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <span className="text-gray-400 text-sm">Applying instruction</span>
              <span className="inline-flex ml-1">
                <span className="animate-bounce mx-[1px] size-1.5 bg-gray-400 rounded-full [animation-delay:0ms]" />
                <span className="animate-bounce mx-[1px] size-1.5 bg-gray-400 rounded-full [animation-delay:150ms]" />
                <span className="animate-bounce mx-[1px] size-1.5 bg-gray-400 rounded-full [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs text-gray-500">
          Examples: Create a 90 second video · Use realistic images · Generate only 6 scenes · Use female narration · Explain for kids · Regenerate narration · Rebuild video
        </p>
        <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Create a 2 minute educational video with realistic images..."
          disabled={loading}
          className="flex-1 border rounded-lg px-4 py-2 text-black placeholder-gray-400 disabled:opacity-50 text-sm"
        />

        <button
          onClick={() => void handleSend()}
          disabled={loading || !input.trim()}
          className="bg-indigo-600 text-white px-5 rounded-lg py-2 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Apply
        </button>
        </div>
      </div>
    </div>
  );
}
