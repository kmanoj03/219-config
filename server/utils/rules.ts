import yaml from "js-yaml";
import type { Finding } from "../models/findings.js";
import type { FileType } from "../models/types.js";
import { findLineRange } from "./lines.js";

let idSeq = 1;
const gid = () => `RULE-${String(idSeq++).padStart(4, "0")}`;

function getK8sPodSpecs(text: string): any[] {
  const specs: any[] = [];
  try {
    const docs: any[] = [];
    yaml.loadAll(text, (doc) => docs.push(doc));
    for (const doc of docs) {
      if (!doc || typeof doc !== "object") continue;
      if (doc.kind === "Pod" && doc.spec) {
        specs.push(doc.spec);
        continue;
      }
      const templateSpec = doc?.spec?.template?.spec;
      if (templateSpec) specs.push(templateSpec);
    }
  } catch {
    // Keep rule engine best-effort and non-blocking
  }
  return specs;
}

export function applyRuleChecks(text: string, fileType: FileType): Finding[] {
  const findings: Finding[] = [];

  if (fileType === "dockerfile") {
    const lrFromLatest = findLineRange(text, /^\s*FROM\s+\S+:latest\b/im);
    if (lrFromLatest) {
      findings.push({
        id: gid(),
        title: "Unpinned base image tag",
        severity: "MEDIUM",
        owaspTop10: "A03:2025 - Software Supply Chain Failures",
        lineRange: lrFromLatest,
        evidence: "FROM ...:latest",
        rationale: "Using mutable tags like latest makes builds non-deterministic and increases supply-chain risk.",
        recommendation: "Pin images to immutable version tags or digests.",
        source: "rule",
      });
    }

    const hasUser = /^\s*USER\s+\S+/im.test(text);
    if (!hasUser) {
      findings.push({
        id: gid(),
        title: "Container may run as root",
        severity: "HIGH",
        owaspTop10: "A02:2025 - Security Misconfiguration",
        lineRange: findLineRange(text, /^\s*(CMD|ENTRYPOINT)\b/im),
        evidence: "No USER directive found",
        rationale: "Running containers as root violates least privilege and increases blast radius.",
        recommendation: "Create a non-root user and switch with a USER directive.",
        source: "rule",
      });
    }

    const lrSensitiveExpose = findLineRange(text, /^\s*EXPOSE\s+(22|2375)\b/im);
    if (lrSensitiveExpose) {
      const exposedPort = text.match(/^\s*EXPOSE\s+(22|2375)\b/im)?.[1] || "sensitive";
      findings.push({
        id: gid(),
        title: "Sensitive port exposed",
        severity: "HIGH",
        owaspTop10: "A02:2025 - Security Misconfiguration",
        lineRange: lrSensitiveExpose,
        evidence: `EXPOSE ${exposedPort}`,
        rationale: "Exposing sensitive management ports increases attack surface.",
        recommendation: "Remove sensitive EXPOSE directives and gate access via network controls.",
        source: "rule",
      });
    }
  }

  if (fileType === "k8s") {
    const podSpecs = getK8sPodSpecs(text);
    for (const spec of podSpecs) {
      const containers = [...(spec?.containers || []), ...(spec?.initContainers || [])];
      for (const container of containers) {
        const name = container?.name || "container";
        const sc = container?.securityContext;

        if (!sc || sc.runAsNonRoot !== true) {
          findings.push({
            id: gid(),
            title: `[${name}] Missing runAsNonRoot`,
            severity: "HIGH",
            owaspTop10: "A02:2025 - Security Misconfiguration",
            lineRange: findLineRange(text, /runAsNonRoot/i),
            evidence: "securityContext.runAsNonRoot is not true",
            rationale: "Workloads should avoid root execution to enforce least privilege.",
            recommendation: "Set securityContext.runAsNonRoot: true for all containers.",
            source: "rule",
          });
        }

        if (sc?.allowPrivilegeEscalation === true) {
          findings.push({
            id: gid(),
            title: `[${name}] Privilege escalation allowed`,
            severity: "HIGH",
            owaspTop10: "A02:2025 - Security Misconfiguration",
            lineRange: findLineRange(text, /allowPrivilegeEscalation\s*:\s*true/i),
            evidence: "allowPrivilegeEscalation: true",
            rationale: "Privilege escalation weakens container isolation boundaries.",
            recommendation: "Set allowPrivilegeEscalation: false.",
            source: "rule",
          });
        }

        if (!container?.resources?.limits) {
          findings.push({
            id: gid(),
            title: `[${name}] Missing resource limits`,
            severity: "MEDIUM",
            owaspTop10: "A02:2025 - Security Misconfiguration",
            lineRange: findLineRange(text, /resources\s*:/i),
            evidence: "resources.limits missing",
            rationale: "Missing limits increases resource abuse and reliability risk.",
            recommendation: "Define cpu and memory limits for each container.",
            source: "rule",
          });
        }
      }
    }
  }

  return findings;
}
