import { validateCredentials } from "../middleware/auth.js";

/**
 * @param {import("express").Application} app
 */
export default function (app) {
  app.get("/login", getLogin);
  app.post("/login", postLogin);
}

/**
 * @typedef {import("express").Request & {session: import("express-session").Session & import("../domain/types.js").CustomSessionData}} AuthRequest
 */

/**
 * Render the login page.
 * @param {AuthRequest} req
 * @param {import("express").Response} res
 */
function getLogin(req, res) {
  // If already authenticated, redirect to home
  if (req.session && req.session.authenticated) {
    return res.redirect("/");
  }

  res.render("login", { error: null });
}

/**
 * Handle login form submission.
 * @param {AuthRequest} req
 * @param {import("express").Response} res
 */
async function postLogin(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render("login", { error: "Username and password are required" });
  }

  const isValid = await validateCredentials(username, password);

  if (!isValid) {
    return res.render("login", { error: "Invalid username or password" });
  }

  // Set session as authenticated
  req.session.authenticated = true;
  req.session.username = username;

  // Redirect to the originally requested URL or home
  const returnTo = req.session.returnTo || "/";
  delete req.session.returnTo;
  return res.redirect(returnTo);
}
