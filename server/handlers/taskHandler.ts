// So this is the business logic for the creation of tasks and
// later get them to make changes to it. (the update logic will be implemented soon...)

import type { AgentTask, FileType } from "../models/types.js";
import { Storage } from "./storage.js";

export function createTask(payload: {
  fileType?: FileType;
  text?: string;
  imageBase64?: string;
}) {
  const { fileType, text, imageBase64 } = payload;
  if (!fileType || (!text && !imageBase64)) {
    return { error: "fileType and text|imageBase64 required", status: 400 };
  }

  const id = `tsk_${Date.now()}`;
  const now = new Date().toISOString();
  const task: AgentTask = {
    id,
    fileType,
    state: "INGESTED",
    input: { text, imageBase64 },
    createdAt: now,
    updatedAt: now,
  };

  Storage.create(task);
  return { taskId: id, status: 200 };
}

export function getTask(id: string) {
  const task = Storage.get(id);
  if (!task) {
    return { error: "not found", status: 404 };
  }
  return { data: task, status: 200 };
}
