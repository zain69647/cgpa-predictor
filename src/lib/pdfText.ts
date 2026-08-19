import * as pdfjs from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

interface Piece {
  x: number;
  y: number;
  str: string;
}

/**
 * Rebuild the visual line layout of a page: group text items by their vertical
 * position, then order each line left-to-right. Marksheets are tables, so a
 * flat "join everything with spaces" pass destroys row boundaries and makes
 * subjects drift into the wrong semester.
 */
function piecesToLines(pieces: Piece[]): string {
  const rows: Piece[][] = [];
  const tolerance = 3;

  pieces
    .slice()
    .sort((a, b) => b.y - a.y || a.x - b.x)
    .forEach((piece) => {
      const row = rows.find((r) => Math.abs(r[0].y - piece.y) <= tolerance);
      if (row) row.push(piece);
      else rows.push([piece]);
    });

  return rows
    .map((row) =>
      row
        .sort((a, b) => a.x - b.x)
        .map((p) => p.str)
        .join("  ")
        .replace(/[ \t]{3,}/g, "   ")
        .trim(),
    )
    .filter((line) => line.length > 0)
    .join("\n");
}

export async function extractPdfText(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  const max = Math.min(pdf.numPages, 30);
  for (let i = 1; i <= max; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pieces: Piece[] = content.items.flatMap((item) => {
      if (!("str" in item) || !item.str.trim()) return [];
      const t = (item as { transform: number[] }).transform;
      return [{ x: t[4], y: t[5], str: item.str }];
    });
    pages.push(`--- Page ${i} ---\n${piecesToLines(pieces)}`);
  }
  return pages.join("\n\n");
}
