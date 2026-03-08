import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, RotateCcw, GraduationCap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Subject {
  id: string;
  name: string;
  marks: string;
  creditHours: string;
}

const getGradePoint = (marks: number): number => {
  if (marks >= 85) return 4.0;
  if (marks >= 80) return 3.7;
  if (marks >= 75) return 3.3;
  if (marks >= 70) return 3.0;
  if (marks >= 65) return 2.7;
  if (marks >= 61) return 2.3;
  if (marks >= 58) return 2.0;
  if (marks >= 55) return 1.7;
  if (marks >= 50) return 1.0;
  return 0;
};

const getGradeLetter = (marks: number): string => {
  if (marks >= 85) return "A";
  if (marks >= 80) return "A-";
  if (marks >= 75) return "B+";
  if (marks >= 70) return "B";
  if (marks >= 65) return "B-";
  if (marks >= 61) return "C+";
  if (marks >= 58) return "C";
  if (marks >= 55) return "C-";
  if (marks >= 50) return "D";
  return "F";
};

const createSubject = (): Subject => ({
  id: crypto.randomUUID(),
  name: "",
  marks: "",
  creditHours: "3",
});

type Mode = "simple" | "advanced";

export default function CGPACalculator() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [currentCGPA, setCurrentCGPA] = useState("");
  const [completedHours, setCompletedHours] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([createSubject()]);

  const updateSubject = (id: string, field: keyof Subject, value: string) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const addSubject = () => setSubjects((prev) => [...prev, createSubject()]);
  const removeSubject = (id: string) => {
    if (subjects.length > 1) setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const reset = () => {
    setMode(null);
    setCurrentCGPA("");
    setCompletedHours("");
    setSubjects([createSubject()]);
  };

  const warnings = useMemo(
    () => subjects.filter((s) => s.marks && Number(s.marks) > 100).map((s) => s.name || "Unnamed"),
    [subjects]
  );

  const results = useMemo(() => {
    const valid = subjects.filter(
      (s) => s.marks && s.creditHours && !isNaN(Number(s.marks)) && !isNaN(Number(s.creditHours))
    );
    if (valid.length === 0) return null;

    let tw = 0, tc = 0;
    valid.forEach((s) => {
      const m = Number(s.marks);
      const c = Number(s.creditHours);
      tw += getGradePoint(m) * c;
      tc += c;
    });

    const semGPA = tc > 0 ? tw / tc : 0;
    const oldCGPA = Number(currentCGPA) || 0;

    if (mode === "simple") {
      // Simple: no completed hours, just blend equally
      // Assume previous semesters had same total credits worth
      // Actually for simple mode, new CGPA is not well-defined without completed hours
      // We'll just show semester GPA and a rough estimate using CGPA as prior
      // Treat it as if old hours = tc (one semester worth)
      const newCGPA = oldCGPA > 0 ? (oldCGPA + semGPA) / 2 : semGPA;
      return { semesterGPA: semGPA.toFixed(2), newCGPA: newCGPA.toFixed(2), totalSemesterCredits: tc, isSimple: true };
    }

    const oldHours = Number(completedHours) || 0;
    const totalHours = oldHours + tc;
    const newCGPA = totalHours > 0 ? (oldCGPA * oldHours + semGPA * tc) / totalHours : semGPA;

    return { semesterGPA: semGPA.toFixed(2), newCGPA: newCGPA.toFixed(2), totalSemesterCredits: tc, isSimple: false };
  }, [subjects, currentCGPA, completedHours, mode]);

  // Mode selection screen
  if (mode === null) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-lg">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">CGPA Calculator</h1>
            <p className="mt-1 text-sm text-muted-foreground">Punjab University Grading System</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-4">
            <button
              onClick={() => setMode("simple")}
              className="w-full rounded-2xl bg-card p-5 text-left shadow-sm border border-border hover:border-primary/40 transition-colors"
            >
              <h2 className="text-lg font-semibold text-card-foreground">Simple Mode</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your current CGPA and expected marks. Quick estimate without credit hour history.
              </p>
            </button>

            <button
              onClick={() => setMode("advanced")}
              className="w-full rounded-2xl bg-card p-5 text-left shadow-sm border border-border hover:border-primary/40 transition-colors"
            >
              <h2 className="text-lg font-semibold text-card-foreground">Advanced Mode</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter previous CGPA and completed credit hours for a precise calculation.
              </p>
            </button>
          </motion.div>

          <GradingTable />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {mode === "simple" ? "Simple" : "Advanced"} Mode
            </h1>
            <p className="text-xs text-muted-foreground">Punjab University Grading</p>
          </div>
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 text-muted-foreground">
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>

        <div className="space-y-4">
          {/* CGPA Input Card */}
          <div className="rounded-2xl bg-card p-5 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {mode === "simple" ? "Current CGPA" : "Previous CGPA"}
                </label>
                <Input
                  type="number" step="0.01" min="0" max="4"
                  placeholder="e.g. 3.05" value={currentCGPA}
                  onChange={(e) => setCurrentCGPA(e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              {mode === "advanced" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Completed Credit Hours
                  </label>
                  <Input
                    type="number" min="0" placeholder="e.g. 17"
                    value={completedHours}
                    onChange={(e) => setCompletedHours(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="rounded-xl bg-warning/10 border border-warning/30 px-4 py-3 text-sm text-warning-foreground">
              ⚠️ Marks exceed 100 for: {warnings.join(", ")}
            </div>
          )}

          {/* Subjects */}
          <div className="rounded-2xl bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-card-foreground">Upcoming Subjects</h2>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {subjects.map((subject, idx) => {
                  const marks = Number(subject.marks);
                  const hasMarks = subject.marks !== "" && !isNaN(marks);
                  return (
                    <motion.div
                      key={subject.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="relative rounded-xl border border-border bg-background p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">SUBJECT {idx + 1}</span>
                        {subjects.length > 1 && (
                          <button onClick={() => removeSubject(subject.id)} className="rounded-lg p-1 text-destructive/60 hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <Input
                        placeholder="Subject name" value={subject.name}
                        onChange={(e) => updateSubject(subject.id, "name", e.target.value)}
                        className="mb-3 h-11 text-base"
                      />

                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="mb-1 block text-xs text-muted-foreground">Expected Marks</label>
                          <Input
                            type="number" min="0" max="100" placeholder="0-100"
                            value={subject.marks}
                            onChange={(e) => updateSubject(subject.id, "marks", e.target.value)}
                            className="h-11 text-base"
                          />
                        </div>
                        <div className="w-24">
                          <label className="mb-1 block text-xs text-muted-foreground">Credit Hrs</label>
                          <Input
                            type="number" min="1" placeholder="3"
                            value={subject.creditHours}
                            onChange={(e) => updateSubject(subject.id, "creditHours", e.target.value)}
                            className="h-11 text-base"
                          />
                        </div>
                      </div>

                      {hasMarks && (
                        <div className="mt-3 flex items-center gap-3 text-sm">
                          <span className="rounded-lg bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                            {getGradeLetter(marks)}
                          </span>
                          <span className="text-muted-foreground">GP: {getGradePoint(marks).toFixed(1)}</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <Button variant="outline" onClick={addSubject} className="mt-4 h-11 w-full gap-2 border-dashed text-base">
              <Plus className="h-4 w-4" /> Add Another Subject
            </Button>
          </div>

          {/* Results */}
          {results && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg">
              <h3 className="mb-4 text-center text-sm font-medium uppercase tracking-wider opacity-80">Estimated Results</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-primary-foreground/10 p-4 text-center">
                  <div className="text-3xl font-bold">{results.semesterGPA}</div>
                  <div className="mt-1 text-xs opacity-80">Semester GPA</div>
                </div>
                <div className="rounded-xl bg-primary-foreground/10 p-4 text-center">
                  <div className="text-3xl font-bold">{results.newCGPA}</div>
                  <div className="mt-1 text-xs opacity-80">New CGPA</div>
                </div>
              </div>
              <div className="mt-3 text-center text-sm opacity-70">
                Total semester credits: {results.totalSemesterCredits}
                {results.isSimple && (
                  <span className="block text-xs mt-1">* Rough estimate — use Advanced Mode for precision</span>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <GradingTable />
      </div>
    </div>
  );
}

function GradingTable() {
  return (
    <details className="mt-8">
      <summary className="cursor-pointer text-center text-sm font-medium text-muted-foreground hover:text-foreground">
        View Grading Table
      </summary>
      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2.5 text-left font-semibold text-foreground">Marks</th>
              <th className="px-4 py-2.5 text-center font-semibold text-foreground">Grade</th>
              <th className="px-4 py-2.5 text-right font-semibold text-foreground">GP</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {[
              ["85–100", "A", "4.0"], ["80–84", "A-", "3.7"], ["75–79", "B+", "3.3"],
              ["70–74", "B", "3.0"], ["65–69", "B-", "2.7"], ["61–64", "C+", "2.3"],
              ["58–60", "C", "2.0"], ["55–57", "C-", "1.7"], ["50–54", "D", "1.0"],
              ["< 50", "F", "0"],
            ].map(([m, g, gp]) => (
              <tr key={m} className="border-b border-border last:border-0">
                <td className="px-4 py-2">{m}</td>
                <td className="px-4 py-2 text-center font-medium">{g}</td>
                <td className="px-4 py-2 text-right">{gp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
