import { Router } from "express";
import { createTask, getTask } from "../handlers/taskHandler.js";

export const taskRouter = Router();

// POST /api/task
taskRouter.post("/", (req, res) => {
  const result = createTask(req.body);
  res
    .status(result.status)
    .json(result.error ? { error: result.error } : { taskId: result.taskId });
});

// GET /api/task/:id
taskRouter.get("/:id", (req, res) => {
  const result = getTask(req.params.id);
  res
    .status(result.status)
    .json(result.error ? { error: result.error } : result.data);
});
