import type { Finding } from "../models/findings.js";

// Map fileType → ID prefix
const PREFIX: Record<string, string> = {
  dockerfile: "DOCK",
  k8s: "K8S",
  env: "ENV",
  nginx: "NGX",
  iam: "IAM",
};

// collapse whitespace for safer substring match
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

function inferLineRangeFromEvidence(
  text: string,
  evidence?: string
): [number, number] | undefined {
  if (!evidence) return;
  const lines = text.split(/\r?\n/);

  // Absence-of-USER heuristic: pin to CMD/ENTRYPOINT line
  if (
    /\babsence of user directive\b/i.test(evidence) ||
    /no.*\buser\b/i.test(evidence)
  ) {
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*(CMD|ENTRYPOINT)\b/i.test(lines[i])) return [i + 1, i + 1];
    }
  }

  const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const ev = norm(evidence).replace(/[`'"]/g, ""); // strip quotes/backticks for robust match
  for (let i = 0; i < lines.length; i++) {
    const L = norm(lines[i]).replace(/[`'"]/g, "");
    if (L.includes(ev) || ev.includes(L)) return [i + 1, i + 1];
  }
}

/** Normalize IDs to CG-<PREFIX>-### while preserving order */
function normalizeIds(fileType: string, items: Finding[]): Finding[] {
  const prefix = PREFIX[fileType] || "GEN";
  return items.map((f, idx) => ({
    ...f,
    id: `CG-${prefix}-${String(idx + 1).padStart(3, "0")}`,
  }));
}

const ORDER: Record<Finding["severity"], number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

export function sortFindingsDesc(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    const sev = ORDER[b.severity] - ORDER[a.severity];
    if (sev !== 0) return sev;
    return (a.title || "").localeCompare(b.title || "");
  });
}

/** Post-process merged findings: infer line ranges, normalize IDs, cap count, sort */
export function postprocessFindings(opts: {
  fileType: string;
  text: string;
  findings: Finding[];
  limit?: number;
}): Finding[] {
  const { fileType, text } = opts;
  const limit = Math.max(
    1,
    Math.min(opts.limit ?? Number(process.env.FINDINGS_LIMIT || 8), 50)
  );

  const enriched = opts.findings.map((f) => ({
    ...f,
    source: f.source ?? ("llm" as const),
    lineRange: f.lineRange ?? inferLineRangeFromEvidence(text, f.evidence),
  }));

  const normalized = normalizeIds(fileType, enriched);

  return sortFindingsDesc(normalized).slice(0, limit);
}

// Backward-compatible alias used by older call sites
export const postprocessFindingsLLMOnly = postprocessFindings;
