import { Storage } from "./storage.js";
import type { Finding } from "../models/findings.js";
import { geminiGeneratePlain } from "./gemini.js";

const REPORT_PROMPT = (fileType: string, findings: Finding[], summary: string) => `
Generate a comprehensive security report in Markdown format for a ${fileType} configuration file analysis.

Findings Summary: ${summary}

Security Findings:
${findings.map((f, i) => `
${i + 1}. **${f.title}** (${f.severity})
   - **Evidence**: \`${f.evidence}\`
   - **Rationale**: ${f.rationale}
   - **Recommendation**: ${f.recommendation}
   - **Source**: ${f.source}
   ${f.lineRange ? `- **Location**: Lines ${f.lineRange[0]}-${f.lineRange[1]}` : ''}
`).join('\n')}

Please generate a professional security report that includes:
1. Executive Summary
2. Risk Assessment
3. Detailed Findings
4. Recommendations
5. Next Steps

Format the report in clean Markdown with proper headers, bullet points, and code blocks where appropriate.
`;

export async function generateReport(id: string) {
  const task = Storage.get(id);
  if (!task) return { status: 404, error: "not found" } as const;

  const findings: Finding[] = task.findings || [];
  if (!findings.length) {
    return {
      status: 400,
      error: "no findings on task; run analyze first",
    } as const;
  }

  try {
    const prompt = REPORT_PROMPT(task.fileType, findings, task.summary || "Security analysis completed");
    const markdown = await geminiGeneratePlain(prompt);
    
    return { status: 200, markdown } as const;
  } catch (e: any) {
    return {
      status: 500,
      error: "report_generation_failed",
      detail: e?.message,
    } as const;
  }
}
