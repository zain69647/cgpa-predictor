# Free Marksheet Analyzer

Replace the AI-credit-consuming PDF parsing with a free, client-side CSV/Excel template upload. Students download a template, fill in their subjects/marks, and upload it back — no AI call, no credits.

## Plan

1. **Create a downloadable template**
   - Add a public/static template file (`/marksheet-template.csv`) with columns: `Semester`, `Subject Code`, `Subject Title`, `Credit Hours`, `Marks`.
   - Provide a download button in the upload UI.

2. **Build client-side parser**
   - Add `src/lib/parseMarksheetTemplate.ts` to parse CSV/Excel rows into `ParsedSemester[]`.
   - Validate required fields and numeric ranges; show clear errors for bad rows.

3. **Update `MarksheetUpload.tsx`**
   - Switch the primary flow to template upload.
   - Show instructions and a download-template button.
   - Accept `.csv` and `.xlsx` files; parse locally and call `onParsed`.
   - Keep PDF upload only as an optional "Analyze PDF (uses AI credits)" secondary button with a clear credit warning.

4. **Keep storage optional**
   - Template files can still be uploaded to the `marksheets` bucket for later reuse, but parsing happens in the browser.
   - The `parse-marksheet` edge function remains available for PDF analysis when credits are available and the user explicitly chooses it.

5. **Verify**
   - Build passes.
   - Test the template download/upload flow with sample data.
   - Confirm the analyzer UI still works with parsed data.
