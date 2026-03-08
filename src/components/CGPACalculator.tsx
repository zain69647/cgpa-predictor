import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, RotateCcw, GraduationCap, BookOpen, ChevronDown } from "lucide-react";
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

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
};

const pulseGlow = {
  animate: {
    boxShadow: [
      "0 0 0 0 hsl(210 70% 35% / 0)",
      "0 0 20px 4px hsl(210 70% 35% / 0.15)",
      "0 0 0 0 hsl(210 70% 35% / 0)",
    ],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

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
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10 text-center"
          >
            <motion.div
              className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary"
              animate={pulseGlow.animate}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </motion.div>
            <motion.h1
              className="text-2xl font-bold tracking-tight text-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              CGPA Calculator
            </motion.h1>
            <motion.p
              className="mt-1 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              Punjab University Grading System
            </motion.p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            {[
              { m: "simple" as Mode, title: "Simple Mode", desc: "Enter your current CGPA and expected marks. Quick estimate without credit hour history." },
              { m: "advanced" as Mode, title: "Advanced Mode", desc: "Enter previous CGPA and completed credit hours for a precise calculation." },
            ].map(({ m, title, desc }) => (
              <motion.button
                key={m}
                variants={fadeUp}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode(m)}
                className="w-full rounded-2xl bg-card p-5 text-left shadow-sm border border-border hover:border-primary/40 hover:shadow-md transition-shadow"
              >
                <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </motion.button>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <GradingTable />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-6 flex items-center justify-between"
        >
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {mode === "simple" ? "Simple" : "Advanced"} Mode
            </h1>
            <p className="text-xs text-muted-foreground">Punjab University Grading</p>
          </div>
          <motion.div whileHover={{ rotate: -180 }} transition={{ duration: 0.4 }}>
            <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 text-muted-foreground">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </motion.div>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
          {/* CGPA Input Card */}
          <motion.div variants={fadeUp} className="rounded-2xl bg-card p-5 shadow-sm">
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

              <AnimatePresence>
                {mode === "advanced" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Completed Credit Hours
                    </label>
                    <Input
                      type="number" min="0" placeholder="e.g. 17"
                      value={completedHours}
                      onChange={(e) => setCompletedHours(e.target.value)}
                      className="h-12 text-base"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Warnings */}
          <AnimatePresence>
            {warnings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="rounded-xl bg-warning/10 border border-warning/30 px-4 py-3 text-sm text-warning-foreground"
              >
                ⚠️ Marks exceed 100 for: {warnings.join(", ")}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Subjects */}
          <motion.div variants={fadeUp} className="rounded-2xl bg-card p-5 shadow-sm">
            <motion.div
              className="mb-4 flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -5, 0] }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <BookOpen className="h-5 w-5 text-primary" />
              </motion.div>
              <h2 className="text-lg font-semibold text-card-foreground">Upcoming Subjects</h2>
            </motion.div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {subjects.map((subject, idx) => {
                  const marks = Number(subject.marks);
                  const hasMarks = subject.marks !== "" && !isNaN(marks);
                  return (
                    <motion.div
                      key={subject.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: -100 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className="relative rounded-xl border border-border bg-background p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">SUBJECT {idx + 1}</span>
                        {subjects.length > 1 && (
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.8 }}
                            onClick={() => removeSubject(subject.id)}
                            className="rounded-lg p-1 text-destructive/60 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
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

                      <AnimatePresence>
                        {hasMarks && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                            className="mt-3 flex items-center gap-3 text-sm"
                          >
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 15 }}
                              className="rounded-lg bg-primary/10 px-2.5 py-1 font-semibold text-primary"
                            >
                              {getGradeLetter(marks)}
                            </motion.span>
                            <span className="text-muted-foreground">GP: {getGradePoint(marks).toFixed(1)}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" onClick={addSubject} className="mt-4 h-11 w-full gap-2 border-dashed text-base">
                <Plus className="h-4 w-4" /> Add Another Subject
              </Button>
            </motion.div>
          </motion.div>

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg overflow-hidden relative"
              >
                {/* Decorative animated circles */}
                <motion.div
                  className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-primary-foreground/5"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-primary-foreground/5"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />

                <h3 className="mb-4 text-center text-sm font-medium uppercase tracking-wider opacity-80 relative z-10">
                  Estimated Results
                </h3>
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  {[
                    { value: results.semesterGPA, label: "Semester GPA" },
                    { value: results.newCGPA, label: "New CGPA" },
                  ].map(({ value, label }, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 * i, duration: 0.4 }}
                      className="rounded-xl bg-primary-foreground/10 p-4 text-center"
                    >
                      <motion.div
                        className="text-3xl font-bold"
                        key={value}
                        initial={{ scale: 1.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {value}
                      </motion.div>
                      <div className="mt-1 text-xs opacity-80">{label}</div>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: 0.4 }}
                  className="mt-3 text-center text-sm relative z-10"
                >
                  Total semester credits: {results.totalSemesterCredits}
                  {results.isSimple && (
                    <span className="block text-xs mt-1">* Rough estimate — use Advanced Mode for precision</span>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <GradingTable />
        </motion.div>
      </div>
    </div>
  );
}

function GradingTable() {
  const [open, setOpen] = useState(false);

  const rows = [
    ["85–100", "A", "4.0"], ["80–84", "A-", "3.7"], ["75–79", "B+", "3.3"],
    ["70–74", "B", "3.0"], ["65–69", "B-", "2.7"], ["61–64", "C+", "2.3"],
    ["58–60", "C", "2.0"], ["55–57", "C-", "1.7"], ["50–54", "D", "1.0"],
    ["< 50", "F", "0"],
  ];

  return (
    <div className="mt-8">
      <motion.button
        onClick={() => setOpen(!open)}
        className="mx-auto flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        View Grading Table
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
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
                  {rows.map(([m, g, gp], i) => (
                    <motion.tr
                      key={m}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-2">{m}</td>
                      <td className="px-4 py-2 text-center font-medium">{g}</td>
                      <td className="px-4 py-2 text-right">{gp}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
