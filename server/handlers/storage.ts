// This is more like, trying to create a task (when user interacts and gives in a file/text)
// and later query through ID to get hold of the task we are targetting and
// finally the update logic to pave our way towards the end goal and keep updating the status.

import type { AgentTask } from "../models/types.js";

const tasks = new Map<string, AgentTask>();

export const Storage = {
  create(task: AgentTask) {
    tasks.set(task.id, task);
    return task;
  },
  get(id: string) {
    return tasks.get(id) || null;
  },
  update(id: string, patch: Partial<AgentTask>) {
    const prev = tasks.get(id);
    if (!prev) return null;
    const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
    tasks.set(id, next);
    return next;
  },
};
