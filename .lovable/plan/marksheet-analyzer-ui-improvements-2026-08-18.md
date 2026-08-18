# Marksheet Analyzer UI Improvements

Tighten the analyzer layout so students can see the CGPA summary while editing and scroll less.

## Changes

1. Sticky CGPA summary bar
   - Make the "Current CGPA / After your edits" card `position: sticky` near the top of the analyzer so it stays visible while the user scrolls through semesters.
   - Keep the existing reset button inside the sticky bar.

2. Shorter improvement priority list
   - Reduce the improvement priority list from the top 6 subjects to the top 3.

3. Compact 2x2 subject grid per semester
   - Render each semester's subjects in a 2-column grid (`grid-cols-2`) on larger screens, falling back to a single column on small screens.
   - Shrink each subject card: smaller input, tighter padding, and keep marks/grade/grade-point on one line where possible.
   - This mirrors the compact "university marksheet" look and cuts overall scroll length.

## Files to edit

- `src/components/marksheet/MarksheetAnalyzer.tsx`

## Verification

- Open `/marksheet`, upload or simulate a parsed result, scroll the semester list, and confirm the CGPA summary remains visible.
- Confirm the improvement priority section shows at most 3 subjects.
- Confirm subjects display in a 2-column grid on desktop and a single column on mobile.
