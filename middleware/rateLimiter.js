import rateLimit from "express-rate-limit";

// General API rate limiter (for read operations)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: "Too many requests, please try again later."
  }
});

// Stricter rate limiter for write operations (POST, PUT, DELETE)
export const writeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many write attempts, please try again later."
  }
});

// Strict rate limiter for admin operations
export const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many admin requests, please try again later."
  }
});
