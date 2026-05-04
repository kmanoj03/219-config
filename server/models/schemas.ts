// Basically this strengths the server ; this acts as the base language
// which the agent would speak consistently acorss the pipeline.
// If not for this ; one malformed res from gemini would make the UI go crazy with broken fields.

import { z } from "zod";

export const OwaspTop10Schema = z.enum([
  "A01:2025 - Broken Access Control",
  "A02:2025 - Security Misconfiguration",
  "A03:2025 - Software Supply Chain Failures",
  "A04:2025 - Cryptographic Failures",
  "A05:2025 - Injection",
  "A06:2025 - Insecure Design",
  "A07:2025 - Authentication Failures",
  "A08:2025 - Software or Data Integrity Failures",
  "A09:2025 - Security Logging and Alerting Failures",
  "A10:2025 - Mishandling of Exceptional Conditions",
]);

export const FindingSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    owaspTop10: OwaspTop10Schema,
    lineRange: z.tuple([z.number(), z.number()]).optional(),
    evidence: z.string(),
    rationale: z.string(),
    recommendation: z.string(),
    autofixHint: z.string().optional(),
    source: z.enum(["rule", "llm"]).optional(),
  })
  .passthrough();

export const FindingsPayloadSchema = z.object({
  fileType: z.enum(["dockerfile", "k8s", "env", "nginx", "iam"]),
  summary: z.string(),
  findings: z.array(FindingSchema),
});
export type FindingsPayload = z.infer<typeof FindingsPayloadSchema>;
