import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SYSTEM_PROMPT = `You extract structured academic data from Punjab University detailed marks certificates.
The input is the PDF text with its original line/table layout preserved (one table row per line, columns separated by multiple spaces).
Return ONLY JSON matching this shape:
{"semesters":[{"name":"Semester 1","subjects":[{"code":"CS-101","title":"Programming Fundamentals","creditHours":3,"marks":78,"totalMarks":100}]}]}
Rules:
- Work line by line, in document order. A semester heading (e.g. "Semester 1", "1st Semester", "Semester-II", a session/roll block) starts a new semester; EVERY subject row after it belongs to that semester until the next semester heading appears.
- Never move a subject into a different semester, never merge two semesters, and never split one semester into two. The number of subjects per semester must exactly match the rows printed under that heading.
- One subject row = one subject object. Do not create extra objects for continuation lines (a long subject title wrapped onto the next line belongs to the previous subject), and do not drop rows.
- Ignore non-subject rows: totals, "Total", "GPA", "CGPA", "Grand Total", credit summaries, headers, footers, page markers, result/remarks lines.
- creditHours and marks must be numbers. If marks are out of something other than 100, set totalMarks accordingly, otherwise 100.
- If a subject's obtained marks are missing, use null for marks.
- Keep semesters in chronological order and name them "Semester 1", "Semester 2", ... following the document order.
- Never invent subjects that are not in the text. Output JSON only, no markdown fences.`;


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const body = await req.json().catch(() => null);
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : '';
    const storagePath = typeof body?.storagePath === 'string' ? body.storagePath.trim() : '';
    const filename = typeof body?.filename === 'string' ? body.filename.trim().slice(0, 200) : '';
    const text = typeof body?.text === 'string' ? body.text : '';

    if (sessionId.length < 8 || sessionId.length > 64 || !storagePath || !filename) {
      return json({ error: 'Invalid request.' }, 400);
    }
    if (text.trim().length < 40) {
      return json(
        {
          error:
            'No readable text found in this PDF. It looks like a scanned copy — please upload the original text-based marks certificate, or enter your marks manually.',
        },
        422,
      );
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return json({ error: 'AI is not configured for this project.' }, 500);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-5.6-sol',
        reasoning_effort: 'medium',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text.slice(0, 60000) },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const details = await aiResponse.text();
      console.error(`AI gateway failed [${aiResponse.status}]: ${details}`);
      const message =
        aiResponse.status === 429
          ? 'The analyzer is busy right now. Please try again in a minute.'
          : aiResponse.status === 402
            ? 'AI credits are exhausted for this app. Please add credits and try again.'
            : 'Could not analyze the marksheet.';
      return json({ error: message, status: aiResponse.status, details }, aiResponse.status);
    }

    const completion = await aiResponse.json();
    const content: string = completion?.choices?.[0]?.message?.content ?? '';
    let parsed: unknown;
    try {
      parsed = JSON.parse(content.replace(/^```(?:json)?|```$/g, '').trim());
    } catch {
      console.error('Model returned non-JSON content');
      return json({ error: 'Could not read the marksheet structure. Please try again.' }, 502);
    }

    const semesters = (parsed as { semesters?: unknown })?.semesters;
    if (!Array.isArray(semesters) || semesters.length === 0) {
      return json(
        { error: 'No semester data was found in this PDF. Please check the file and try again.' },
        422,
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error: insertError } = await supabase.from('marksheet_uploads').insert({
      session_id: sessionId,
      storage_path: storagePath,
      original_filename: filename,
      parsed: { semesters },
    });
    if (insertError) console.error('Failed to store upload record:', insertError.message);

    return json({ semesters });
  } catch (error) {
    console.error('parse-marksheet failed:', error);
    return json({ error: 'Unexpected error while analyzing the marksheet.' }, 500);
  }
});
