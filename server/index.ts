import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Healthcheck endpoints for Railway
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "EduTrack API is running", timestamp: new Date().toISOString() });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// Simple in-memory auth store
export const authStore = new Map<string, number>();

// Simple auth middleware
export async function requireAuth(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log("requireAuth - no auth header");
    return res.status(401).json({ message: "Non authentifié" });
  }
  
  const token = authHeader.substring(7);
  const userId = authStore.get(token);
  console.log("requireAuth - token:", token, "userId:", userId, "authStore size:", authStore.size);
  if (!userId) {
    console.log("requireAuth - userId not found for token");
    return res.status(401).json({ message: "Non authentifié" });
  }
  
  req.userId = userId;
  next();
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Simple database check in production
  if (process.env.NODE_ENV === "production") {
    log("🚀 Starting in production mode");
    if (process.env.DATABASE_URL) {
      log("✅ DATABASE_URL found");
    } else {
      log("⚠️ DATABASE_URL not found");
    }
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use Railway's PORT or default to 5000
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
