// The entire analysis happens here?

import { Storage } from "./storage.js";
import { postprocessFindings } from "../utils/postprocess.js";
import type { Finding } from "../models/findings.js";
import { ANALYZE_PROMPT } from "../utils/prompts.js";
import {
  geminiAnalyzeText,
  geminiVisionToText,
  geminiRepairJson,
} from "./gemini.js";
import { FindingSchema, FindingsPayloadSchema } from "../models/schemas.js";
import { mergeFindings } from "../utils/merge.js";
import { parseWithRepair } from "../utils/llmJson.js";
import { applyRuleChecks } from "../utils/rules.js";

const OWASP_BY_CODE: Record<string, Finding["owaspTop10"]> = {
  A01: "A01:2025 - Broken Access Control",
  A02: "A02:2025 - Security Misconfiguration",
  A03: "A03:2025 - Software Supply Chain Failures",
  A04: "A04:2025 - Cryptographic Failures",
  A05: "A05:2025 - Injection",
  A06: "A06:2025 - Insecure Design",
  A07: "A07:2025 - Authentication Failures",
  A08: "A08:2025 - Software or Data Integrity Failures",
  A09: "A09:2025 - Security Logging and Alerting Failures",
  A10: "A10:2025 - Mishandling of Exceptional Conditions",
};

function normalizeOwaspTop10(raw: unknown): Finding["owaspTop10"] | undefined {
  if (typeof raw !== "string") return undefined;
  const codeMatch = raw.toUpperCase().match(/\bA(0[1-9]|10)\b/);
  if (!codeMatch) return undefined;
  const code = `A${codeMatch[1]}`;
  return OWASP_BY_CODE[code];
}

function normalizeParsedPayload(parsed: any) {
  if (!parsed || typeof parsed !== "object") return parsed;
  if (!Array.isArray(parsed.findings)) return parsed;

  return {
    ...parsed,
    findings: parsed.findings.map((f: any) => ({
      ...f,
      owaspTop10: normalizeOwaspTop10(f?.owaspTop10) ?? f?.owaspTop10,
    })),
  };
}

const DEFAULT_OWASP: Finding["owaspTop10"] =
  "A02:2025 - Security Misconfiguration";

function extractLLMFindings(parsed: any): { summary: string; findings: Finding[] } {
  if (!parsed || typeof parsed !== "object") {
    return { summary: "", findings: [] };
  }

  const summary = typeof parsed.summary === "string" ? parsed.summary : "";
  const rawFindings = Array.isArray(parsed.findings) ? parsed.findings : [];

  const findings: Finding[] = [];
  for (const rawFinding of rawFindings) {
    const normalized = {
      ...rawFinding,
      owaspTop10: normalizeOwaspTop10(rawFinding?.owaspTop10) ?? DEFAULT_OWASP,
      source: "llm" as const,
    };
    const safeFinding = FindingSchema.safeParse(normalized);
    if (safeFinding.success) {
      findings.push(safeFinding.data);
    }
  }

  return { summary, findings };
}

export async function analyzeTask(id: string) {
  const task = Storage.get(id);
  if (!task) return { status: 404, error: "not found" } as const;

  try {
    // 1) Ensure text (OCR if image) and persist OCR output on task input
    let rawText = task.input.text;
    if (!rawText && task.input.imageBase64) {
      const ocr = await geminiVisionToText(
        "Extract the literal text content of this configuration file or terminal output. Return only the raw text without any markdown formatting or code blocks.",
        task.input.imageBase64
      );
      // Strip markdown code blocks if present
      const cleanText = ocr.replace(/^```[\s\S]*?\n([\s\S]*?)\n```$/gm, '$1').trim();
      rawText = cleanText;
      task.input.text = cleanText;
      Storage.update(task.id, { input: task.input });
    }
    if (!rawText) return { status: 400, error: "no input text" } as const;

    // 2) Deterministic baseline checks
    const ruleFindings = applyRuleChecks(rawText, task.fileType);

    // 3) LLM audit (best-effort; rules still return if LLM fails)
    let llmFindings: Finding[] = [];
    let llmSummary = "";
    try {
      const prompt = ANALYZE_PROMPT(task.fileType, rawText);
      const llmRaw = await geminiAnalyzeText(prompt);
      const parsed = await parseWithRepair(llmRaw, geminiRepairJson);
      const normalizedParsed = normalizeParsedPayload(parsed);
      if (normalizedParsed) {
        const safeWholePayload = FindingsPayloadSchema.safeParse(normalizedParsed);
        if (safeWholePayload.success) {
          llmSummary = safeWholePayload.data.summary || "";
          llmFindings = (safeWholePayload.data.findings || []).map((x) => ({
            ...x,
            source: "llm" as const,
          }));
        } else {
          const salvaged = extractLLMFindings(normalizedParsed);
          llmSummary = salvaged.summary;
          llmFindings = salvaged.findings;
        }
      }
    } catch {
      // swallow LLM failures so deterministic findings can still be returned
    }

    // 4) Merge rule + LLM findings, then enrich/sort/cap
    const deduped = mergeFindings(ruleFindings, llmFindings);
    const findings = postprocessFindings({
      fileType: task.fileType,
      text: rawText,
      findings: deduped,
      // optional: override via env FINDINGS_LIMIT, default 8
    });

    const summary =
      llmSummary ||
      (ruleFindings.length > 0
        ? "Hybrid analysis completed with deterministic and AI findings."
        : "No findings detected.");
    Storage.update(task.id, {
      state: "PLANNED" as const,
      findings,
      summary,
    });
    return { status: 200, summary, findings } as const;
  } catch (e: any) {
    return {
      status: 500,
      error: "analyze_failed",
      detail: e?.message,
    } as const;
  }
}
