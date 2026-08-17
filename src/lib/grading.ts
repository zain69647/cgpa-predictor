export const GRADE_BANDS = [
  { min: 85, letter: "A", gp: 4.0 },
  { min: 80, letter: "A-", gp: 3.7 },
  { min: 75, letter: "B+", gp: 3.3 },
  { min: 70, letter: "B", gp: 3.0 },
  { min: 65, letter: "B-", gp: 2.7 },
  { min: 61, letter: "C+", gp: 2.3 },
  { min: 58, letter: "C", gp: 2.0 },
  { min: 55, letter: "C-", gp: 1.7 },
  { min: 50, letter: "D", gp: 1.0 },
  { min: 0, letter: "F", gp: 0 },
] as const;

export const getGradePoint = (marks: number): number =>
  GRADE_BANDS.find((b) => marks >= b.min)?.gp ?? 0;

export const getGradeLetter = (marks: number): string =>
  GRADE_BANDS.find((b) => marks >= b.min)?.letter ?? "F";

/** Marks needed for the next better grade, or null when already at the top band. */
export const nextBandMarks = (marks: number): number | null => {
  const better = [...GRADE_BANDS].reverse().find((b) => b.min > marks);
  return better ? better.min : null;
};

export interface ParsedSubject {
  code?: string | null;
  title?: string | null;
  creditHours: number;
  marks: number | null;
  totalMarks?: number | null;
}

export interface ParsedSemester {
  name: string;
  subjects: ParsedSubject[];
}

export interface FlatSubject {
  id: string;
  semesterIndex: number;
  semesterName: string;
  code: string;
  title: string;
  creditHours: number;
  marks: number | null;
}

export const flattenSemesters = (semesters: ParsedSemester[]): FlatSubject[] =>
  semesters.flatMap((sem, si) =>
    (sem.subjects ?? []).map((sub, sj) => ({
      id: `${si}-${sj}`,
      semesterIndex: si,
      semesterName: sem.name || `Semester ${si + 1}`,
      code: sub.code ?? "",
      title: sub.title ?? "Subject",
      creditHours: Number(sub.creditHours) || 0,
      marks:
        sub.marks === null || sub.marks === undefined || isNaN(Number(sub.marks))
          ? null
          : Number(sub.marks),
    })),
  );

export const cgpaOf = (subjects: { creditHours: number; marks: number | null }[]): number => {
  let points = 0;
  let credits = 0;
  subjects.forEach((s) => {
    if (s.marks === null || s.creditHours <= 0) return;
    points += getGradePoint(s.marks) * s.creditHours;
    credits += s.creditHours;
  });
  return credits > 0 ? points / credits : 0;
};

export const semesterGpa = (
  subjects: { creditHours: number; marks: number | null }[],
): number => cgpaOf(subjects);

export const totalCredits = (
  subjects: { creditHours: number; marks: number | null }[],
): number =>
  subjects.reduce((sum, s) => (s.marks === null ? sum : sum + (s.creditHours || 0)), 0);

/** CGPA gain if this subject were improved to the next grade band. */
export const improvementGain = (subjects: FlatSubject[], subjectId: string): number => {
  const target = subjects.find((s) => s.id === subjectId);
  if (!target || target.marks === null || target.creditHours <= 0) return 0;
  const next = nextBandMarks(target.marks);
  if (next === null) return 0;
  const base = cgpaOf(subjects);
  const improved = cgpaOf(
    subjects.map((s) => (s.id === subjectId ? { ...s, marks: next } : s)),
  );
  return improved - base;
};
