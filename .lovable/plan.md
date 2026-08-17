# Marksheet Upload & CGPA What-If Simulator

An extra feature on top of the existing calculator: a student uploads their detailed marks certificate (PDF) covering all semesters, the site reads it, shows every subject, and lets them edit any subject's marks to instantly see the effect on final CGPA.

## User flow

1. From the mode screen, a third option: "Upload Marksheet (Beta)".
2. Student picks a PDF. The file is uploaded and kept in a storage folder so it can be reused later for improvements.
3. Loading state while the PDF is read and analyzed.
4. Result page: semesters listed as cards, each with its subjects (code, title, credit hours, obtained marks, grade, grade point) and semester GPA. Overall CGPA at the top.
5. Every marks field is editable. Editing recalculates instantly:
   - that subject's grade + grade point
   - that semester's GPA
   - overall credit-weighted CGPA
   - a "CGPA impact" figure per subject showing the CGPA gain from lifting that subject to the next grade band
6. An "Improvement priority" list sorts subjects by highest potential CGPA gain, so students see which subject to retake first.
7. Reset button restores original extracted marks. Original vs. edited CGPA shown side by side.

## Backend (Lovable Cloud)

Backend is needed for storage and analysis, so Lovable Cloud gets enabled.

- Private storage bucket `marksheets`. Each upload goes to `marksheets/<session-id>/<timestamp>-<filename>.pdf`, keeping all raw PDFs collected in one place for later use.
- Table `marksheet_uploads`: id, storage path, original filename, uploaded_at, parsed JSON result, plus a client-generated `session_id` so a student's own uploads are readable without login. RLS policies plus grants included.
- Edge function `parse-marksheet`: receives the storage path, downloads the PDF, extracts its text layer, sends the text to Lovable AI with a strict JSON schema (semesters -> subjects -> code, title, credit hours, marks, total marks), validates the result, stores it on the row, and returns it.
- If the PDF has no text layer (a scan), the function returns a clear message asking for the text-based official PDF; the app shows it and offers manual entry instead of failing silently.

## Calculation rules

- Grade bands and grade points reuse the existing Punjab University table in the app.
- Semester GPA = sum(grade point x credit hours) / semester credit hours.
- Final CGPA = sum(grade point x credit hours) across all semesters / total credit hours (credit-weighted).
- Potential gain per subject = CGPA if that subject's marks were raised to the next grade band, minus current CGPA.

## Technical notes

- New route `/marksheet` with `src/pages/Marksheet.tsx`; components `MarksheetUpload`, `SemesterList`, `SubjectRow`, `ImprovementPriority`, `CgpaSummaryBar`.
- Grade logic moved out of `CGPACalculator.tsx` into `src/lib/grading.ts` and shared; the existing calculator keeps working unchanged.
- Client-side validation with zod: PDF mime type only, max 10MB, capped file name length.
- Edited marks kept in React state keyed by subject id with parsed data as the immutable baseline; recalculation memoized, no server round-trips while editing.
- Styling and animation follow the current design tokens and Framer Motion patterns.
