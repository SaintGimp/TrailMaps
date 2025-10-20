import crypto from "crypto";

/**
 * Middleware to generate a unique CSP nonce for each request
 * This nonce is used to allow specific inline scripts while blocking others
 */
export function generateNonce(req, res, next) {
  res.locals.cspNonce = crypto.randomBytes(16).toString("base64");
  next();
}
