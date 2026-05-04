import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { existsSync } from "fs";
import { taskRouter } from "routes/tasks.js";
import { analyzeRouter } from "./routes/analyze.js";
import { reportRouter } from "./routes/report.js";

const app = express();
app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || "*").split(",") }));
app.use(express.json({ limit: "10mb" }));

// API routes
app.use("/api/task", taskRouter);
app.use("/api/analyze", analyzeRouter);
app.use("/api/report", reportRouter);

app.get("/healthz", (_req, res) => res.json({ ok: true }));

// Serve static files from client/dist in production
if (process.env.NODE_ENV === "production") {
  // Try multiple possible paths (server directory or project root)
  const possiblePaths = [
    path.resolve(process.cwd(), "../client/dist"), // Running from server/
    path.resolve(process.cwd(), "client/dist"), // Running from project root
  ];

  let clientDistPath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (existsSync(possiblePath)) {
      clientDistPath = possiblePath;
      break;
    }
  }

  if (clientDistPath) {
    app.use(express.static(clientDistPath));

    // Handle client-side routing - return index.html for all non-API routes
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDistPath!, "index.html"));
    });
    console.log(`Serving frontend from ${clientDistPath}`);
  } else {
    console.warn(
      "Warning: Could not find client/dist directory. Frontend will not be served."
    );
  }
}

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`ConfigGuardian backend running at http://localhost:${port}`);
});

// test comment
