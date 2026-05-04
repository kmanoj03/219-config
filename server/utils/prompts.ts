// A strong prompt, this is where the soul of the entire idea lies.

export const ANALYZE_PROMPT = (fileType: string, content: string) => `
System: You are a senior security configuration auditor.
Your task is to perform a comprehensive, multi-category audit of the given ${fileType} configuration.
Think like a DevSecOps engineer reviewing for production readiness.

Analyze the file across categories including:
- Supply-chain and dependency security (e.g. unpinned images, unsafe base images)
- Identity and privilege management (runAsNonRoot, allowPrivilegeEscalation, IAM roles, USER directives)
- Network and access exposure (open ports, public endpoints, unencrypted connections)
- Resource governance (resource limits, excessive privileges, missing quotas)
- Secrets and credentials exposure (.env values, tokens, hardcoded keys)
- File system and storage (mounts, hostPath, writable volumes)
- Logging and observability best practices
- Compliance and least privilege
- Other configuration weaknesses that could affect security, stability, or reliability.

Constraints:
- If exact line numbers are unknown, omit "lineRange".
- Avoid duplicates (normalize by title+evidence).
- Limit to the top 8 most important findings**.
- Output strictly valid JSON only.
- Every finding MUST include an "owaspTop10" value from this exact list:
  "A01:2025 - Broken Access Control"
  "A02:2025 - Security Misconfiguration"
  "A03:2025 - Software Supply Chain Failures"
  "A04:2025 - Cryptographic Failures"
  "A05:2025 - Injection"
  "A06:2025 - Insecure Design"
  "A07:2025 - Authentication Failures"
  "A08:2025 - Software or Data Integrity Failures"
  "A09:2025 - Security Logging and Alerting Failures"
  "A10:2025 - Mishandling of Exceptional Conditions"
- Do not report the same root cause twice. If a single directive (e.g., "COPY . .") has multiple impacts (secrets risk + image bloat), combine them into ONE finding with a combined rationale and recommendation.



Return ONLY valid JSON with the following structure:
{
  "fileType": "${fileType}",
  "summary": "short summary of security posture",
  "findings": [
    {
      "id": "CG-XXX",
      "title": "finding title",
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "owaspTop10": "A05:2025 - Injection",
      "lineRange": [start, end],  // if known
      "evidence": "exact line or snippet",
      "rationale": "why this is risky",
      "recommendation": "what to do",
      "autofixHint": "concise patch hint if possible"
    }
  ]
}
Do NOT include any prose, commentary, or markdown outside this JSON.

Now audit this file thoroughly:
${content}
`;

export const REPAIR_JSON_PROMPT = (bad: string) => `
You are a strict JSON fixer. Convert the following model output into STRICTLY VALID JSON that matches this TypeScript type:

type Finding = {
  id: string; title: string; severity: "LOW"|"MEDIUM"|"HIGH"|"CRITICAL";
  owaspTop10:
    "A01:2025 - Broken Access Control"|
    "A02:2025 - Security Misconfiguration"|
    "A03:2025 - Software Supply Chain Failures"|
    "A04:2025 - Cryptographic Failures"|
    "A05:2025 - Injection"|
    "A06:2025 - Insecure Design"|
    "A07:2025 - Authentication Failures"|
    "A08:2025 - Software or Data Integrity Failures"|
    "A09:2025 - Security Logging and Alerting Failures"|
    "A10:2025 - Mishandling of Exceptional Conditions";
  lineRange?: [number,number]; evidence: string; rationale: string; recommendation: string; autofixHint?: string;
};
type FindingsPayload = { fileType: "dockerfile"|"k8s"|"env"|"nginx"|"iam"; summary: string; findings: Finding[]; };

Rules:
- Return ONLY the JSON object, no code fences, no prose.
- If fields are missing, infer minimally or omit optional fields.
- Do NOT invent line numbers. Omit lineRange if unknown.

MODEL OUTPUT TO FIX:
${bad}
`;

export const AUTOFIX_PROMPT = (
  fileType: string,
  original: string,
  findingsJson: string
) => `
System: You generate a MINIMAL, production-safe patch for the given ${fileType}.

Objectives:
- Apply fixes that directly address the provided findings ONLY.
- Keep edits as small as possible (prefer editing existing lines over large rewrites).
- Only introduce multi-stage builds if a finding explicitly calls for it.
- Preserve behavior unless a change is necessary for security.

HARD CONSTRAINTS (do not violate):
- Do NOT add OS packages (no apt-get/apk/yum) unless a finding explicitly requires it.
- Do NOT add labels/metadata unless a finding explicitly requires it.
- Do NOT introduce new tools solely to implement HEALTHCHECK. Prefer existing shell or a Node one-liner.
- Output the FULL, FINAL FILE CONTENT as **plain text only** (no JSON, no code fences, no quotes, no escaped newlines).

Input file (verbatim):
${original}

Findings (JSON):
${findingsJson}
`;

export const AUTOFIX_PROMPT_MINIMAL_RETRY = (
  fileType: string,
  original: string,
  findingsJson: string
) => `
System: The previous attempt added unrelated packages/labels. Re-generate a stricter minimal patch for ${fileType}.

You MUST:
- Remove any lines that install packages (apt-get/apk/yum) or add labels, unless explicitly required by the findings.
- Keep changes limited to those strictly necessary to address the findings.
- Use a Node one-liner for HEALTHCHECK if needed (no package installs).
- Output ONLY the final file as plain text (no JSON/fences/quotes).

Original file:
${original}

Findings (JSON):
${findingsJson}
`;

export const AUTOFIX_REPAIR_TO_PLAINTEXT = (original: string, bad: string) => `
System: Convert the following structured patch output into the final file content.

Rules:
- Apply the described operations to the ORIGINAL FILE.
- Return ONLY the resulting file as plain text.
- Do NOT include JSON, code fences, quotes, or explanations.

ORIGINAL FILE:
${original}

STRUCTURED PATCH OUTPUT:
${bad}
`;
