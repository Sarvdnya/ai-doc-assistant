

import fs from "fs";
import { createRequire } from "module";

// `pdf-parse` 1.x runs a sample file when its package entry point is loaded
// directly by an ESM loader. Loading the implementation file avoids that
// debug-only side effect.
const require = createRequire(import.meta.url);
const pdf: typeof import("pdf-parse") = require("pdf-parse/lib/pdf-parse.js");

export interface ParsedPdf {
  text: string;
  pageCount: number;
}

export async function parsePdf(path: string): Promise<ParsedPdf> {
  const buffer = fs.readFileSync(path);
  const data = await pdf(buffer);

  return {
    text: data.text,
    pageCount: data.numpages,
  };
}

export async function extractPdfText(path: string): Promise<string> {
  const { text } = await parsePdf(path);
  return text;
}
