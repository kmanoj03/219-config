// The same issue might appear twice with different severities.
// Thus we write this piece of code to get a single clean item with the highest severity and dope explaination.

import type { Finding } from "../models/findings.js";

// Severity rank (higher is worse)
const ORDER: Record<Finding["severity"], number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

const normTitle = (s?: string) =>
  (s || "").replace(/\s+/g, " ").trim().toLowerCase();

const normEvidence = (s?: string) =>
  (s || "").replace(/\s+/g, " ").trim().toLowerCase();

// Primary: cluster by evidence; Fallback: title|evidence if no usable evidence
const keyByEvidence = (x: Finding) => {
  const ev = normEvidence(x.evidence);
  return ev ? `ev:${ev}` : "";
};
const keyByTitleEvidence = (x: Finding) =>
  `ti:${normTitle(x.title)}|${normEvidence(x.evidence)}`;

// Prefer more informative/LLM copy even if shorter
const preferLLM = (aSrc?: string, bSrc?: string) =>
  aSrc === "llm" ? aSrc : bSrc === "llm" ? bSrc : aSrc;
const richer = (a?: string, b?: string, aSrc?: string, bSrc?: string) => {
  if (!a) return b;
  if (!b) return a;
  // prefer LLM phrasing on ties-in-length-ish
  if (Math.abs(a.length - b.length) <= 12) {
    const src = preferLLM(aSrc, bSrc);
    return src === "llm"
      ? bSrc === "llm"
        ? b
        : a
      : a.length >= b.length
      ? a
      : b;
  }
  return b.length > a.length ? b : a;
};

// Pick the more precise lineRange
const pickLineRange = (a?: [number, number], b?: [number, number]) => {
  if (a && !b) return a;
  if (b && !a) return b;
  if (a && b) {
    const spanA = Math.abs(a[1] - a[0]);
    const spanB = Math.abs(b[1] - b[0]);
    return spanB < spanA ? b : a;
  }
  return undefined;
};

// Merge two findings representing the same root issue
function mergeTwo(prev: Finding, cur: Finding): Finding {
  const aWins = ORDER[prev.severity] >= ORDER[cur.severity];
  const winner = aWins ? prev : cur;
  const other = aWins ? cur : prev;

  // prefer LLM copy even when winner is rule (if you ever re-add rules)
  const title = winner.title; // keep single title for tightness

  const merged: Finding = {
    ...winner,
    title,
    evidence: richer(
      winner.evidence,
      other.evidence,
      winner.source,
      other.source
    )!,
    rationale: richer(
      winner.rationale,
      other.rationale,
      winner.source,
      other.source
    )!,
    recommendation: richer(
      winner.recommendation,
      other.recommendation,
      winner.source,
      other.source
    )!,
    lineRange: pickLineRange(prev.lineRange, cur.lineRange),
    source: winner.source || other.source,
    autofixHint: winner.autofixHint || other.autofixHint,
  };

  return merged;
}

/**
 * One finding per root cause:
 * - Try evidence-cluster; fall back to title|evidence if evidence empty
 * - Higher severity wins; prefer LLM wording on ties
 * - Keep precise lineRange; keep best evidence/rationale/reco
 */
export function mergeFindings(a: Finding[], b: Finding[]): Finding[] {
  const map = new Map<string, Finding>();

  for (const src of [...a, ...b]) {
    const kEv = keyByEvidence(src);
    const kTi = keyByTitleEvidence(src);
    const key = kEv || kTi;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, src);
    } else {
      map.set(key, mergeTwo(existing, src));
    }
  }
  return Array.from(map.values());
}

/** Sort findings by severity (CRITICAL → LOW), then by normalized title */
export function sortFindingsDesc(findings: Finding[]): Finding[] {
  return [...findings].sort((x, y) => {
    const sev = ORDER[y.severity] - ORDER[x.severity];
    if (sev !== 0) return sev;
    const tx = normTitle(x.title);
    const ty = normTitle(y.title);
    return tx < ty ? -1 : tx > ty ? 1 : 0;
  });
}
