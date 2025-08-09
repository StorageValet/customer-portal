import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import {
  securityHeaders,
  generalRateLimit,
  globalErrorHandler,
  corsOptions,
} from "./middleware/security";

// Global error handlers to prevent server crashes
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Unhandled Rejection] at:", promise, "reason:", reason);
  // Don't exit - keep server running
});

process.on("uncaughtException", (error) => {
  console.error("[Uncaught Exception]:", error);
  // Log but don't exit unless it's truly fatal
  if (error.message.includes("EADDRINUSE")) {
    console.error("Port already in use, exiting...");
    process.exit(1);
  }
});

const app = express();

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(generalRateLimit);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

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
  // Initialize SendGrid email service with error handling
  try {
    const { sendGridService } = await import("./sendgrid-service");
    await sendGridService.initialize();
  } catch (error: any) {
    console.warn("[SendGrid] Initialization failed:", error.message);
    console.warn("[SendGrid] Email functionality will be limited");
    // Continue server startup even if SendGrid fails
  }

  const server = await registerRoutes(app);

  // Global error handler
  app.use(globalErrorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "3000", 10);
  // Bind to all interfaces for better compatibility
  const host = '0.0.0.0';
  server.listen(port, host, () => {
    log(`serving on http://localhost:${port}`);
    console.log(`
✅ Server is running!
────────────────────────────────────
📍 Local URLs:
   - http://localhost:${port}
   - http://127.0.0.1:${port}
   - http://0.0.0.0:${port}

🔧 If you can't access the server:
   - Close VS Code and try again
   - Or use VS Code's port forwarding
   - Check FIX_SERVER_ACCESS.md for solutions
────────────────────────────────────`);
  });

  // Add error handler for server
  server.on("error", (error: any) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use`);
      process.exit(1);
    } else {
      console.error("Server error:", error);
    }
  });
})();
