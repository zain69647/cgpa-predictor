import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  cgpaOf,
  flattenSemesters,
  getGradeLetter,
  getGradePoint,
  improvementTargetMarks,
  maxImprovementGain,
  totalCredits,
  type FlatSubject,
  type ParsedSemester,
} from "@/lib/grading";

interface Props {
  semesters: ParsedSemester[];
  onStartOver: () => void;
}

export default function MarksheetAnalyzer({ semesters, onStartOver }: Props) {
  const original = useMemo(() => flattenSemesters(semesters), [semesters]);
  const [edits, setEdits] = useState<Record<string, string>>({});

  const current: FlatSubject[] = useMemo(
    () =>
      original.map((s) => {
        const edited = edits[s.id];
        if (edited === undefined) return s;
        if (edited === "") return { ...s, marks: null };
        const value = Number(edited);
        return { ...s, marks: isNaN(value) ? s.marks : Math.min(Math.max(value, 0), 100) };
      }),
    [original, edits],
  );

  const originalCgpa = useMemo(() => cgpaOf(original), [original]);
  const newCgpa = useMemo(() => cgpaOf(current), [current]);
  const credits = useMemo(() => totalCredits(current), [current]);
  const dirty = Object.keys(edits).length > 0;

  const priorities = useMemo(
    () =>
      current
        .map((s) => ({ subject: s, gain: maxImprovementGain(current, s.id) }))
        .filter((row) => row.gain > 0.0005)
        .sort((a, b) => b.gain - a.gain || b.subject.creditHours - a.subject.creditHours)
        .slice(0, 3),
    [current],
  );


  const bySemester = useMemo(() => {
    const groups = new Map<number, FlatSubject[]>();
    current.forEach((s) => {
      groups.set(s.semesterIndex, [...(groups.get(s.semesterIndex) ?? []), s]);
    });
    return [...groups.entries()].sort((a, b) => a[0] - b[0]);
  }, [current]);

  const delta = newCgpa - originalCgpa;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="sticky top-4 z-10 rounded-2xl bg-primary p-4 text-primary-foreground shadow-lg"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-primary-foreground/10 p-3 text-center">
            <div className="text-2xl font-bold">{originalCgpa.toFixed(2)}</div>
            <div className="mt-1 text-xs opacity-80">Current CGPA</div>
          </div>
          <div className="rounded-xl bg-primary-foreground/10 p-3 text-center">
            <motion.div
              key={newCgpa.toFixed(2)}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-bold"
            >
              {newCgpa.toFixed(2)}
            </motion.div>
            <div className="mt-1 text-xs opacity-80">After your edits</div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm opacity-90">
          <span>Total credit hours: {credits}</span>
          <span>
            {delta === 0 ? "No change" : `${delta > 0 ? "+" : ""}${delta.toFixed(3)} CGPA`}
          </span>
        </div>
        {dirty && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-3 w-full gap-2"
            onClick={() => setEdits({})}
          >
            <RotateCcw className="h-4 w-4" /> Restore original marks
          </Button>
        )}
      </motion.div>

      {/* Improvement priority */}
      {priorities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card p-5 shadow-sm"
        >
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">Improvement priority</h2>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            Top subjects that would lift your CGPA if you reached the next grade.
          </p>
          <ul className="space-y-2">
            {priorities.map(({ subject, gain }) => (
              <li
                key={subject.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground">
                    {subject.code ? `${subject.code} — ` : ""}
                    {subject.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {subject.semesterName} · {subject.creditHours} cr ·{" "}
                    {subject.marks ?? "—"} → {improvementTargetMarks(subject.marks ?? 0) ?? "—"} marks
                  </div>
                </div>
                <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-1 font-semibold text-primary">
                  +{gain.toFixed(3)}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Semesters */}
      {bySemester.map(([index, subjects]) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="rounded-2xl bg-card p-4 shadow-sm"
        >
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-card-foreground">
              {subjects[0].semesterName}
            </h2>
            <span className="text-sm text-muted-foreground">
              GPA {cgpaOf(subjects).toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {subjects.map((subject) => {
              const marks = subject.marks;
              return (
                <div
                  key={subject.id}
                  className="rounded-xl border border-border bg-background p-2.5"
                >
                  <div className="mb-1.5 min-w-0">
                    <div className="truncate text-sm font-medium leading-tight text-foreground">
                      {subject.code ? `${subject.code} — ` : ""}
                      {subject.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {subject.creditHours} cr
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={edits[subject.id] ?? (marks === null ? "" : String(marks))}
                      onChange={(e) =>
                        setEdits((prev) => ({ ...prev, [subject.id]: e.target.value }))
                      }
                      className="h-8 w-20 text-sm"
                      aria-label={`Marks for ${subject.title}`}
                    />
                    {marks !== null && (
                      <>
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {getGradeLetter(marks)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          GP {getGradePoint(marks).toFixed(1)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}

      <Button variant="outline" className="h-11 w-full" onClick={onStartOver}>
        Upload a different marksheet
      </Button>
    </div>
  );
}
