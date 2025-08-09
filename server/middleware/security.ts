import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { Request, Response, NextFunction } from "express";

/**
 * Rate limiting configurations for different endpoints
 */

// General API rate limit
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 1000 : 100, // Higher limit in dev
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for test email endpoint in development
    return process.env.NODE_ENV === "development" && req.path === "/api/test-email";
  },
});

// Strict rate limit for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: "Too many authentication attempts, please try again later.",
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limit for file uploads
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 uploads per hour
  message: "Upload limit exceeded, please try again later.",
});

// Rate limit for AI chat endpoints
export const aiChatRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 AI requests per minute
  message: "AI chat rate limit exceeded, please slow down.",
});

// Rate limit for Stripe webhook endpoints
export const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Higher limit for webhooks
  message: "Webhook rate limit exceeded.",
});

/**
 * Security headers configuration
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://api.openai.com"],
      frameSrc: ["https://js.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for Stripe
});

/**
 * Error handling middleware
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error catcher
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handler
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let { statusCode = 500, message } = err;

  // Log error details (in production, use a proper logging service)
  console.error("ERROR 💥", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Invalid data provided";
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your token has expired. Please log in again.";
  }

  // Stripe errors
  if (err.type === "StripeCardError") {
    statusCode = 400;
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    status: "error",
    message,
    ...(process.env.NODE_ENV === "development" && {
      error: err,
      stack: err.stack,
    }),
  });
};

/**
 * Request validation middleware
 */
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details[0].message,
      });
    }
    next();
  };
};

/**
 * API key validation (for external integrations)
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
    return res.status(401).json({
      status: "error",
      message: "Invalid API key",
    });
  }

  next();
};

/**
 * CORS configuration for production
 */
export const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    const allowedOrigins = [
      process.env.PORTAL_DOMAIN,
      process.env.MARKETING_DOMAIN,
      "https://storage-valet-portal.vercel.app",
      "http://localhost:3000",
      "http://localhost:5173", // Vite dev server
      "http://localhost:3001", // Same-origin requests
      "http://127.0.0.1:5173", // Alternative localhost
      "http://127.0.0.1:3001", // Alternative localhost
    ].filter(Boolean);

    // Allow requests with no origin (like mobile apps or direct API calls)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In development, be more permissive
      if (process.env.NODE_ENV === "development") {
        console.log(`⚠️  CORS: Allowing origin ${origin} in development mode`);
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
