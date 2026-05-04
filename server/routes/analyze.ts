import { Router } from "express";
import { analyzeTask } from "../handlers/analyzeHandler.js";

export const analyzeRouter = Router();

// POST /api/analyze/:id
analyzeRouter.post("/:id", async (req, res) => {
  const result = await analyzeTask(req.params.id);
  return res.status(result.status).json(
    result.status === 200
      ? {
          taskId: req.params.id,
          summary: result.summary,
          findings: result.findings,
        }
      : result
  );
});
