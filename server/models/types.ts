// This is like the brain of the agent, it knows what kinda file it's handling, what state is the flow at
// and it retains the text/image which was the data input, it also stores the datetime for logging/de-bugging too.

export type FileType = "dockerfile" | "k8s" | "env" | "nginx" | "iam";

export interface AgentTask {
  id: string;
  fileType: FileType;
  state:
    | "INGESTED"
    | "ANALYZED"
    | "PLANNED"
    | "REPORTED"
    | "DONE";
  input: { text?: string; imageBase64?: string };
  findings?: import("./findings.js").Finding[];
  summary?: string;
  createdAt: string;
  updatedAt: string;
}
