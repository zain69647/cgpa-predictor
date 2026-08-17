import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileUp, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { extractPdfText } from "@/lib/pdfText";
import type { ParsedSemester } from "@/lib/grading";

const fileSchema = z.object({
  name: z.string().min(1).max(200),
  size: z.number().max(10 * 1024 * 1024, "File must be smaller than 10MB"),
  type: z.literal("application/pdf", { message: "Please upload a PDF file" }),
});

const getSessionId = () => {
  const key = "marksheet-session-id";
  let id = localStorage.getItem(key);
  if (!id || id.length < 8) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
};

const safeName = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "marksheet.pdf";

interface Props {
  onParsed: (semesters: ParsedSemester[]) => void;
}

export default function MarksheetUpload({ onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    const check = fileSchema.safeParse({ name: file.name, size: file.size, type: file.type });
    if (!check.success) {
      setError(check.error.issues[0]?.message ?? "Invalid file");
      return;
    }

    setBusy(true);
    try {
      setStatus("Reading your marksheet…");
      const text = await extractPdfText(file);

      setStatus("Saving a copy…");
      const sessionId = getSessionId();
      const storagePath = `${sessionId}/${Date.now()}-${safeName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("marksheets")
        .upload(storagePath, file, { contentType: "application/pdf" });
      if (uploadError) throw new Error(uploadError.message);

      setStatus("Analyzing subjects and semesters…");
      const { data, error: fnError } = await supabase.functions.invoke("parse-marksheet", {
        body: { sessionId, storagePath, filename: file.name, text },
      });

      if (fnError) {
        let message = "Could not analyze the marksheet.";
        try {
          const ctx = (fnError as { context?: Response }).context;
          if (ctx) {
            const parsedBody = JSON.parse(await ctx.text());
            if (parsedBody?.error) message = parsedBody.error;
          }
        } catch {
          /* keep default message */
        }
        throw new Error(message);
      }
      if (data?.error) throw new Error(data.error);
      onParsed(data.semesters as ParsedSemester[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
      setStatus(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-dashed border-border bg-card p-6 text-center"
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
        <FileUp className="h-6 w-6 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-card-foreground">Upload your marksheet</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Attach your detailed marks certificate (PDF) covering all semesters. We read every subject,
        then you can edit any marks to see the effect on your CGPA.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      <Button
        className="mt-5 h-12 w-full text-base"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {busy ? status ?? "Working…" : "Choose PDF"}
      </Button>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </motion.p>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Text-based PDFs only (not scanned photos). Max 10MB.
      </p>
    </motion.div>
  );
}
