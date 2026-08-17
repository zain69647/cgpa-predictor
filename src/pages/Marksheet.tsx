import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FileSearch } from "lucide-react";
import MarksheetUpload from "@/components/marksheet/MarksheetUpload";
import MarksheetAnalyzer from "@/components/marksheet/MarksheetAnalyzer";
import type { ParsedSemester } from "@/lib/grading";

export default function Marksheet() {
  const [semesters, setSemesters] = useState<ParsedSemester[] | null>(null);

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-center justify-between"
        >
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <FileSearch className="h-5 w-5 text-primary" />
              Marksheet Analyzer
            </h1>
            <p className="text-xs text-muted-foreground">
              Plan improvement exams with Punjab University grading
            </p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </motion.div>

        {semesters ? (
          <MarksheetAnalyzer semesters={semesters} onStartOver={() => setSemesters(null)} />
        ) : (
          <MarksheetUpload onParsed={setSemesters} />
        )}
      </div>
    </div>
  );
}
