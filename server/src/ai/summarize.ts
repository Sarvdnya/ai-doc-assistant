export interface SummaryResult {
  summary: string;
  keyPoints: string[];
}

export async function summarizeDocument(_text: string): Promise<SummaryResult> {
  throw new Error("AI summarization not implemented yet");
}
