import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const PDFJS = require("pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js");

export interface PageContent {
  pageNumber: number;
  text: string;
}

export async function parsePdfPages(filePath: string): Promise<PageContent[]> {
  const buffer = fs.readFileSync(filePath);

  PDFJS.disableWorker = true;
  const doc = await PDFJS.getDocument(buffer);

  const pages: PageContent[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    let lastY: number | null = null;
    let text = "";

    for (const item of content.items) {
      const y = (item as { transform: number[] }).transform[5];
      if (lastY === null || lastY === y) {
        text += (item as { str: string }).str;
      } else {
        text += "\n" + (item as { str: string }).str;
      }
      lastY = y;
    }

    pages.push({ pageNumber: i, text: text.trim() });
    console.log(`[PDF] Extracted Page ${i}`);
  }

  doc.destroy();
  return pages;
}
