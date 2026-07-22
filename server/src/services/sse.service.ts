import type { Response } from "express";

export interface ProgressEvent {
  step: string;
  status: "running" | "completed" | "failed";
  current?: number;
  total?: number;
  message?: string;
}

class SseManager {
  private clients = new Map<string, Set<Response>>();

  addClient(documentId: string, res: Response): void {
    if (!this.clients.has(documentId)) {
      this.clients.set(documentId, new Set());
    }
    this.clients.get(documentId)!.add(res);

    res.on("close", () => {
      this.clients.get(documentId)?.delete(res);
      if (this.clients.get(documentId)?.size === 0) {
        this.clients.delete(documentId);
      }
    });
  }

  emit(documentId: string, event: string, data: ProgressEvent): void {
    const clients = this.clients.get(documentId);
    if (!clients) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of clients) {
      try {
        res.write(payload);
      } catch {
        clients.delete(res);
      }
    }
  }

  emitProgress(documentId: string, data: ProgressEvent): void {
    this.emit(documentId, "progress", data);
  }

  emitError(documentId: string, message: string): void {
    this.emit(documentId, "error", { step: "failed", status: "failed", message });
  }

  emitComplete(documentId: string, message?: string): void {
    this.emit(documentId, "complete", { step: "completed", status: "completed", message: message ?? "Video generated successfully" });
  }
}

export const sseManager = new SseManager();
