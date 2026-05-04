import { Router } from "express";
import { generateReport } from "../handlers/reportHandler.js";

export const reportRouter = Router();

// POST /api/report/:id
reportRouter.post("/:id", async (req, res) => {
  const result = await generateReport(req.params.id);
  res
    .status(result.status)
    .json(result.error ? { error: result.error, detail: result.detail } : result);
});
