export interface ProgressEvent {
  step: string;
  status: "running" | "completed" | "failed";
  current?: number;
  total?: number;
  message?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export function connectProgress(
  documentId: string,
  callbacks: {
    onProgress: (event: ProgressEvent) => void;
    onComplete?: (event: ProgressEvent) => void;
    onError?: (message: string) => void;
  }
): () => void {
  const url = `${API_BASE_URL}/api/video/progress/${documentId}`;
  const source = new EventSource(url);

  source.addEventListener("progress", (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data) as ProgressEvent;
      callbacks.onProgress(data);
    } catch {
      // ignore malformed events
    }
  });

  source.addEventListener("complete", (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data) as ProgressEvent;
      callbacks.onComplete?.(data);
    } catch {
      // ignore
    }
  });

  source.addEventListener("error", (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data) as ProgressEvent;
      callbacks.onError?.(data.message ?? "An error occurred");
    } catch {
      callbacks.onError?.("Connection lost");
    }
  });

  source.onerror = () => {
    callbacks.onError?.("Connection lost");
  };

  return () => source.close();
}
