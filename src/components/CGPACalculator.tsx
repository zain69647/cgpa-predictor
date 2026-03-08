import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, RotateCcw, GraduationCap, TrendingUp, BookOpen } from "lucide-react";
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

export default function CGPACalculator() {
  const [step, setStep] = useState(1);
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
    setStep(1);
    setCurrentCGPA("");
    setCompletedHours("");
    setSubjects([createSubject()]);
  };

  const results = useMemo(() => {
    const validSubjects = subjects.filter(
      (s) => s.name && s.marks && s.creditHours && !isNaN(Number(s.marks)) && !isNaN(Number(s.creditHours))
    );
    if (validSubjects.length === 0) return null;

    let totalWeighted = 0;
    let totalCredits = 0;

    validSubjects.forEach((s) => {
      const marks = Number(s.marks);
      const ch = Number(s.creditHours);
      totalWeighted += getGradePoint(marks) * ch;
      totalCredits += ch;
    });

    const semesterGPA = totalCredits > 0 ? totalWeighted / totalCredits : 0;

    const oldCGPA = Number(currentCGPA) || 0;
    const oldHours = Number(completedHours) || 0;
    const totalHours = oldHours + totalCredits;

    const newCGPA =
      totalHours > 0
        ? (oldCGPA * oldHours + semesterGPA * totalCredits) / totalHours
        : semesterGPA;

    return {
      semesterGPA: semesterGPA.toFixed(2),
      newCGPA: newCGPA.toFixed(2),
      totalSemesterCredits: totalCredits,
    };
  }, [subjects, currentCGPA, completedHours]);

  const warnings = useMemo(() => {
    return subjects
      .filter((s) => s.marks && Number(s.marks) > 100)
      .map((s) => s.name || "Unnamed");
  }, [subjects]);

  const canProceedStep1 = currentCGPA !== "" && completedHours !== "" && !isNaN(Number(currentCGPA)) && !isNaN(Number(completedHours));

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            CGPA Calculator
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Punjab University Grading System
          </p>
        </motion.div>

        {/* Step indicators */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                step >= s ? "w-10 bg-primary" : "w-6 bg-muted"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="rounded-2xl bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-card-foreground">
                    Current Standing
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Current CGPA
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      placeholder="e.g. 3.05"
                      value={currentCGPA}
                      onChange={(e) => setCurrentCGPA(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Completed Credit Hours
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g. 17"
                      value={completedHours}
                      onChange={(e) => setCompletedHours(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="h-12 w-full text-base font-semibold"
              >
                Continue to Subjects
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Info bar */}
              <div className="flex items-center justify-between rounded-xl bg-card px-4 py-3 shadow-sm">
                <div className="text-sm text-muted-foreground">
                  CGPA: <span className="font-semibold text-foreground">{currentCGPA}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Credits: <span className="font-semibold text-foreground">{completedHours}</span>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Edit
                </button>
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
                  <h2 className="text-lg font-semibold text-card-foreground">
                    Upcoming Subjects
                  </h2>
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
                            <span className="text-xs font-semibold text-muted-foreground">
                              SUBJECT {idx + 1}
                            </span>
                            {subjects.length > 1 && (
                              <button
                                onClick={() => removeSubject(subject.id)}
                                className="rounded-lg p-1 text-destructive/60 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          <Input
                            placeholder="Subject name"
                            value={subject.name}
                            onChange={(e) =>
                              updateSubject(subject.id, "name", e.target.value)
                            }
                            className="mb-3 h-11 text-base"
                          />

                          <div className="flex gap-3">
                            <div className="flex-1">
                              <label className="mb-1 block text-xs text-muted-foreground">
                                Expected Marks
                              </label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="0-100"
                                value={subject.marks}
                                onChange={(e) =>
                                  updateSubject(subject.id, "marks", e.target.value)
                                }
                                className="h-11 text-base"
                              />
                            </div>
                            <div className="w-24">
                              <label className="mb-1 block text-xs text-muted-foreground">
                                Credit Hrs
                              </label>
                              <Input
                                type="number"
                                min="1"
                                placeholder="3"
                                value={subject.creditHours}
                                onChange={(e) =>
                                  updateSubject(subject.id, "creditHours", e.target.value)
                                }
                                className="h-11 text-base"
                              />
                            </div>
                          </div>

                          {hasMarks && (
                            <div className="mt-3 flex items-center gap-3 text-sm">
                              <span className="rounded-lg bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                                {getGradeLetter(marks)}
                              </span>
                              <span className="text-muted-foreground">
                                GP: {getGradePoint(marks).toFixed(1)}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                <Button
                  variant="outline"
                  onClick={addSubject}
                  className="mt-4 h-11 w-full gap-2 border-dashed text-base"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Subject
                </Button>
              </div>

              {/* Results */}
              {results && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg"
                >
                  <h3 className="mb-4 text-center text-sm font-medium uppercase tracking-wider opacity-80">
                    Estimated Results
                  </h3>
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
                  </div>
                </motion.div>
              )}

              {/* Reset */}
              <Button
                variant="ghost"
                onClick={reset}
                className="h-11 w-full gap-2 text-muted-foreground"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Everything
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grading table */}
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
                  ["85–100", "A", "4.0"],
                  ["80–84", "A-", "3.7"],
                  ["75–79", "B+", "3.3"],
                  ["70–74", "B", "3.0"],
                  ["65–69", "B-", "2.7"],
                  ["61–64", "C+", "2.3"],
                  ["58–60", "C", "2.0"],
                  ["55–57", "C-", "1.7"],
                  ["50–54", "D", "1.0"],
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
      </div>
    </div>
  );
}
