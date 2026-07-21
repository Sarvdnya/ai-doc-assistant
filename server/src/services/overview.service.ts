import fs from "fs/promises";
import path from "path";
import Chunk from "../models/Chunk.model.js";
import DocumentModel from "../models/Document.model.js";
import { generateText } from "./llm.service.js";
import type { VideoSettings } from "./director.service.js";

const MAX_PROMPT_CHARS = 4_000;
const MAX_CONTENT_CHARS = 2_500;
const SUMMARY_DIR = path.resolve(import.meta.dirname, "../..", "generated", "overview-summaries");

export interface OverviewScene {
  scene: number;
  duration: string;
  narration: string;
  visual: string;
}

export interface Overview {
  title: string;
  mainTopic?: string;
  keyConcepts?: string[];
  learningObjectives?: string[];
  duration: string;
  scenes: OverviewScene[];
}

interface SavedOverview {
  documentId: string;
  overview: Overview;
  settings?: VideoSettings;
}

function overviewPath(documentId: string): string {
  return path.resolve(import.meta.dirname, "../..", "generated", documentId, "metadata", "overview.json");
}

async function readSavedOverview(documentId: string, settings?: VideoSettings): Promise<Overview | null> {
  try {
    const saved = JSON.parse(await fs.readFile(overviewPath(documentId), "utf-8")) as SavedOverview;
    if (saved.documentId === documentId && saved.overview?.scenes?.length && JSON.stringify(saved.settings ?? {}) === JSON.stringify(settings ?? {})) {
      console.log("[RESUME] Overview exists");
      return saved.overview;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("[RESUME] Ignoring unreadable saved overview");
    }
  }
  return null;
}

function splitToLimit(text: string, limit: number): string[] {
  const normalized = text.trim();
  if (normalized.length <= limit) return normalized ? [normalized] : [];

  const parts: string[] = [];
  let remaining = normalized;
  while (remaining.length > limit) {
    const boundary = Math.max(
      remaining.lastIndexOf("\n", limit),
      remaining.lastIndexOf(". ", limit),
      remaining.lastIndexOf(" ", limit)
    );
    const end = boundary > limit * 0.5 ? boundary + 1 : limit;
    parts.push(remaining.slice(0, end).trim());
    remaining = remaining.slice(end).trim();
  }
  if (remaining) parts.push(remaining);
  return parts;
}

function buildSections(chunks: Array<{ text: string }>): string[] {
  const sections: string[] = [];
  for (const chunk of chunks) {
    const text = chunk.text.trim();
    if (!text) continue;
    for (const part of splitToLimit(text, MAX_CONTENT_CHARS)) {
      sections.push(part);
    }
  }
  return sections;
}

function summaryPrompt(text: string): string {
  return `Summarize the following document section.

Rules:
- Maximum 6 bullet points
- Keep only important facts
- Preserve names, numbers and definitions
- No explanations
- No introduction
- No conclusion
- Do not invent information

Section:

${text}`;
}

function mergePrompt(text: string): string {
  return `Merge these summaries into one concise study note.

Return only:

- Main Topic
- Important Concepts
- Important Facts
- Learning Objectives

Maximum 300 words.

${text}`;
}

function finalOverviewPrompt(text: string, settings: VideoSettings = {}): string {
  const sceneCount = settings.sceneCount ?? 8;
  const duration = settings.duration ?? "90 seconds";
  return `Using the study note below, create JSON only.

{
"title":"",
"duration":"${duration}",
"scenes":[
{
"scene":1,
"duration":"8 sec",
"narration":"",
"visual":""
}
]
}

Rules:

- exactly ${sceneCount} scenes
- total video duration must be approximately ${duration}
- narration must be ${settings.narrationStyle ?? "Professional"} and appropriate for ${settings.audience ?? "College Students"}
- narration must be in ${settings.language ?? "English"}
- visual <= 15 words
- simple educational visuals
- no markdown
- no explanation
- JSON only

Study Note:

${text}`;
}

async function generateFromText(
  text: string,
  createPrompt: (part: string) => string
): Promise<string[]> {
  const availableChars = MAX_PROMPT_CHARS - createPrompt("").length;
  if (availableChars < 1) throw new Error("Overview prompt instructions exceed the request limit");

  const parts = splitToLimit(text, Math.min(MAX_CONTENT_CHARS, availableChars));
  const results: string[] = [];
  for (const part of parts) {
    const prompt = createPrompt(part);
    console.log(`[OVERVIEW] Prompt Length: ${prompt.length}`);
    console.log(`[OVERVIEW] Prompt Preview (first 200 chars): ${prompt.slice(0, 200)}`);
    if (prompt.length > MAX_PROMPT_CHARS) {
      console.warn(`[OVERVIEW] Prompt exceeds ${MAX_PROMPT_CHARS} chars; splitting automatically.`);
      results.push(...await generateFromText(part, createPrompt));
      continue;
    }
    results.push(await generateText(prompt));
  }
  return results;
}

async function condenseSummaries(summaries: string[]): Promise<string> {
  let current = summaries;
  while (current.length > 1 || (current[0]?.length ?? 0) > MAX_CONTENT_CHARS) {
    const groups: string[][] = [];
    let group: string[] = [];
    let size = 0;
    for (const summary of current) {
      if (group.length && size + summary.length + 2 > MAX_CONTENT_CHARS) {
        groups.push(group);
        group = [];
        size = 0;
      }
      group.push(summary);
      size += summary.length + 2;
    }
    if (group.length) groups.push(group);
    console.log(`[OVERVIEW] Merging summaries (${groups.length} group${groups.length === 1 ? "" : "s"})`);
    current = [];
    for (const summariesGroup of groups) {
      current.push(...await generateFromText(summariesGroup.join("\n\n"), mergePrompt));
    }
  }
  return current[0] ?? "";
}

function parseOverview(text: string): Overview {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("LLM did not return valid overview JSON");
  try {
    return JSON.parse(text.slice(start, end + 1)) as Overview;
  } catch (error) {
    throw new Error(`overview.service.ts could not parse final overview JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function generateOverview(documentId: string, settings: VideoSettings = {}): Promise<Overview> {
  const savedOverview = await readSavedOverview(documentId, settings);
  if (savedOverview) return savedOverview;

  console.log("[OVERVIEW] Loading document");
  const document = await DocumentModel.findById(documentId).lean();
  if (!document) throw new Error(`Document not found (requestedId: ${documentId})`);

  console.log("[OVERVIEW] Loading chunks");
  const chunks = await Chunk.find({ documentId }).sort({ chunkIndex: 1 }).lean();
  const sections = buildSections(chunks);
  if (!sections.length) throw new Error(`No non-empty chunks found for document "${document.originalName}" (${documentId})`);

  const summaries: string[] = [];
  for (const [index, section] of sections.entries()) {
    console.log(`[OVERVIEW] Chunk ${index + 1}/${sections.length}`);
    console.log("[OVERVIEW] Summarizing chunk...");
    const [summary] = await generateFromText(section, summaryPrompt);
    summaries.push(summary);
    console.log("[OVERVIEW] Summary generated");
  }

  await fs.mkdir(SUMMARY_DIR, { recursive: true });
  const summaryPath = path.join(SUMMARY_DIR, `${documentId}.json`);
  await fs.writeFile(summaryPath, JSON.stringify({ documentId, title: document.originalName, maxPromptChars: MAX_PROMPT_CHARS, summaries }, null, 2));
  console.log(`[OVERVIEW] Saved intermediate summaries: ${summaryPath}`);

  const condensedDocument = await condenseSummaries(summaries);
  console.log("[OVERVIEW] Generating final overview");
  const finalResponses = await generateFromText(condensedDocument, (part) => finalOverviewPrompt(part, settings));
  const overview = parseOverview(finalResponses[0] ?? "");
  const outputPath = overviewPath(documentId);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const temporaryOverviewPath = `${outputPath}.tmp`;
  await fs.writeFile(temporaryOverviewPath, JSON.stringify({ documentId, overview, settings }, null, 2));
  await fs.rename(temporaryOverviewPath, outputPath);
  console.log(`[OVERVIEW] Saved: ${outputPath}`);
  console.log(`[OVERVIEW] Generated "${overview.title}" with ${overview.scenes?.length ?? 0} scenes`);
  return overview;
}
