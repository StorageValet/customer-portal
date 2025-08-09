import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import session from "express-session";
import cors from "cors";
import { createServer } from "http";
import { AirtableSessionStore } from "./airtableSessionStore";
import { ReliableSessionStore } from "./simple-session-store";
import { corsOptions } from "./middleware/security";

// Import route modules
import authRoutes from "./routes/auth-routes";
import itemRoutes from "./routes/item-routes";
import movementRoutes from "./routes/movement-routes";
import paymentRoutes from "./routes/payment-routes";
import adminRoutes from "./routes/admin-routes";
import integrationRoutes from "./routes/integration-routes";
import testEmailRoute from "./routes/test-email-route";

export function registerRoutes(app: express.Express) {
  // Trust proxy if running behind a proxy
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  // Security and performance middleware
  app.use(compression());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());

  // CORS configuration - use the one from security.ts
  app.use(cors(corsOptions));

  // Session configuration with reliable store that has fallback
  let airtableStore = null;
  try {
    if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
      airtableStore = new AirtableSessionStore(process.env.AIRTABLE_API_KEY, process.env.AIRTABLE_BASE_ID);
    }
  } catch (error) {
    console.warn("Failed to initialize Airtable session store, using memory store:", error);
  }
  
  const sessionStore = new ReliableSessionStore(airtableStore);

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "storage-valet-secret-2024",
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
    })
  );

  // Authentication middleware for protected routes
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.user?.id) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Apply route modules
  app.use(authRoutes);
  app.use(adminRoutes); // Admin routes have their own auth middleware

  // Protected routes - apply auth middleware only to API routes
  app.use((req, res, next) => {
    // Only apply auth to API routes
    if (!req.path.startsWith("/api/")) {
      return next();
    }

    // Skip auth for public API routes
    if (
      req.path.startsWith("/api/auth/") ||
      req.path.startsWith("/api/softr/") ||
      req.path.startsWith("/api/ingest/") ||
      req.path === "/api/health" ||
      req.path === "/api/health/ingest" ||
      req.path === "/api/validate-promo" ||
      req.path === "/api/test-email" ||
      req.path === "/api/magic-link"
    ) {
      return next();
    }
    requireAuth(req, res, next);
  });

  app.use(testEmailRoute); // Load test route before integration routes
  app.use(itemRoutes);
  app.use(movementRoutes);
  app.use(paymentRoutes);
  app.use(integrationRoutes);

  // Base health check
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "healthy" });
  });

  // Dev-only: return the last 10 ingests
  app.get("/api/health/ingest", (req: Request, res: Response) => {
    if (process.env.NODE_ENV !== "development") return res.status(404).end();
    // @ts-ignore
    const log = (global as any).INGEST_LOG || [];
    res.json({ ok:true, recent: log.slice(-10) });
  });

  const httpServer = createServer(app);

  // IMPORTANT: Do NOT add catch-all routes (/, *) in development!
  // Vite middleware handles serving the React app for all non-API routes.
  // Adding catch-all routes here will prevent the React app from loading.

  return httpServer;
}
