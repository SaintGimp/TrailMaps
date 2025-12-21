import bcrypt from "bcrypt";

/**
 * Parse AUTH_USERS environment variable into a map of username -> hashed password.
 * Format: "user1:hashedpw1,user2:hashedpw2"
 * @returns {Map<string, string>}
 */
function parseUsers() {
  const users = new Map();
  const authUsers = process.env.AUTH_USERS || "";

  if (!authUsers) {
    console.warn("Warning: AUTH_USERS environment variable not set. No users can log in.");
    return users;
  }

  authUsers.split(",").forEach((entry) => {
    const [username, hashedPassword] = entry.split(":");
    if (username && hashedPassword) {
      users.set(username.trim(), hashedPassword.trim());
    }
  });

  return users;
}

/**
 * Validate username and password against stored credentials.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<boolean>}
 */
export async function validateCredentials(username, password) {
  const users = parseUsers();
  const hashedPassword = users.get(username);

  if (!hashedPassword) {
    // Perform a dummy comparison to prevent timing attacks
    await bcrypt.compare(password, "$2b$10$dummy.hash.to.prevent.timing.attacks");
    return false;
  }

  return bcrypt.compare(password, hashedPassword);
}

/**
 * Middleware to require authentication for routes.
 * Redirects to /login for page requests, returns 401 for API requests.
 * @param {import("express").Request & {session: import("express-session").Session & import("../domain/types.js").CustomSessionData}} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }

  // Check if this is an API request
  if (req.path.startsWith("/api/")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Store the original URL to redirect back after login
  req.session.returnTo = req.originalUrl;
  return res.redirect("/login");
}
