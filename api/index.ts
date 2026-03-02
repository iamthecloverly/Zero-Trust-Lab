/**
 * Vercel Serverless Entry Point
 *
 * Wraps the Express app as a Vercel serverless handler.
 * vercel.json routes /api/* requests here; all other requests
 * are served as static files from dist/public/ (the React SPA).
 *
 * NOTE: This app uses in-memory storage. State persists across
 * warm invocations within the same Vercel instance but resets on
 * cold starts. Suitable for demos; use a persistent DB for production.
 */

import express, { type Request, type Response, type NextFunction } from "express";
import helmet from "helmet";
import { setupRoutes } from "../server/routes";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status =
    (err instanceof Error && "status" in err
      ? (err as { status?: number }).status
      : undefined) ?? 500;
  const message = err instanceof Error ? err.message : "Internal Server Error";
  res.status(status).json({ message });
});

// Initialize routes once for serverless runtime.
const ready = setupRoutes(app).then(() => app);

export default async function handler(req: Request, res: Response) {
  try {
    const expressApp = await ready;
    return expressApp(req, res);
  } catch (error) {
    console.error("Vercel handler initialization failed:", error);
    return res.status(500).json({
      error: "Server initialization failed",
    });
  }
}
