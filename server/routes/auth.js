// ============================================================
// Auth Router – lightweight session-based auth for the static app
// ============================================================
/**
 * File: server/routes/auth.js
 *
 * This file implements a simple username/password login system using
 * browser cookies (sessions). Registered users are saved in the data
 * store, and a logged-in user gets a session cookie used to identify
 * them on later requests. Note: passwords are stored as plain text.
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, updateData } = require('../utils/dataStore');

// In-memory session table: sessionId -> userId. Sessions are lost when the
// server restarts (only the cookie identity matters, not user accounts).
const sessions = new Map();

/**
 * Parses a raw "Cookie" header string (e.g. "a=1; b=2") into an object.
 * Values are URL-decoded, and "=" inside a value is preserved by rejoining.
 * @param {string} [cookieHeader] raw Cookie header (defaults to '')
 * @returns {Object<string, string>} cookie name/value pairs
 */
function parseCookies(cookieHeader = '') {
  // Split on ";" to get each "name=value" piece, then fold them into one object.
  return cookieHeader.split(';').reduce((acc, part) => {
    // split with a limit of 2 keeps the rest of the string in "rest",
    // so a value containing "=" is not cut short.
    const [key, ...rest] = part.trim().split('=');
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

/**
 * Reads the request's session cookie and returns the logged-in user's id,
 * or null if the cookie is missing or refers to an unknown/expired session.
 * @param {Object} req Express request
 * @returns {string|null} userId
 */
function getCurrentUserId(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  // Map.get returns undefined for unknown ids; "|| null" turns that into null.
  return cookies.sessionId ? sessions.get(cookies.sessionId) || null : null;
}

/**
 * Creates a brand-new session for a user and sends it to the browser as an
 * HttpOnly cookie (not readable by JavaScript, better against XSS).
 * @param {Object} res Express response (the Set-Cookie header is set on it)
 * @param {string} userId id of the logged-in user
 * @returns {string} the generated session id
 */
function writeSession(res, userId) {
  // A UUID is unpredictable enough to act as a session key.
  const sessionId = uuidv4();
  sessions.set(sessionId, userId);
  res.setHeader('Set-Cookie', `sessionId=${sessionId}; Path=/; HttpOnly; SameSite=Lax`);
  return sessionId;
}

/**
 * Looks up a user by username (case-insensitive) in the stored users list.
 * @param {string} username username to search for
 * @returns {Promise<Object|null>} the user object, or null if not found
 */
async function findUserByUsername(username) {
  const users = await readData('users');
  // Compare lowercased and trimmed values so "Sam " matches "sam".
  return users.find(u => u.username.toLowerCase() === String(username || '').trim().toLowerCase()) || null;
}

/**
 * Looks up a user by their unique id.
 * @param {string} id user id
 * @returns {Promise<Object|null>} the user object, or null if not found
 */
async function findUserById(id) {
  const users = await readData('users');
  return users.find(u => u.id === id) || null;
}

/**
 * POST /api/auth/register — create a new account and log in.
 *
 * Expects a JSON body with "username" and "password" ("email" optional).
 * Fails with 400 if username/password are missing, or 409 if the
 * username is already taken. On success the user is saved, a session
 * cookie is set, and the public fields (id, username, email) are
 * returned — never the password.
 *
 * Response: 201 { success: true, data: { id, username, email } }.
 */
// The two-string array matches the path with AND without a trailing slash.
router.post(['/register', '/register/'], async (req, res) => {
  try {
    // Coerce to string and trim so numbers/missing fields don't break the checks.
    const username = String(req.body?.username || '').trim();
    const email = String(req.body?.email || '').trim();
    const password = String(req.body?.password || '');

    // Both are required; password isn't trimmed so spaces stay part of it.
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'username and password are required' });
    }

    // Reject duplicate usernames early (case-insensitive check).
    const existing = await findUserByUsername(username);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }

    const user = {
      id: uuidv4(),
      username,
      email,
      password,
      createdAt: new Date().toISOString(),
    };

    // Append the new user to the stored list (updateData saves the result).
    await updateData('users', users => [...users, user]);
    // Log the user in immediately by issuing their session cookie.
    writeSession(res, user.id);

    return res.status(201).json({
      success: true,
      // Only public fields are returned — the password stays server-side.
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/auth/login — sign in with username and password.
 *
 * Expects a JSON body with "username" and "password". Returns 400 if
 * either is missing and 401 if the username doesn't exist or the
 * password is wrong. On success a new session cookie is set.
 *
 * Response: { success: true, data: { id, username, email } }.
 */
router.post(['/login', '/login/'], async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'username and password are required' });
    }

    // Same error for "no such user" and "wrong password" so attackers
    // can't discover which usernames exist.
    const user = await findUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Success: create a fresh session cookie for this user.
    writeSession(res, user.id);
    return res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/auth/logout — end the current session.
 *
 * Reads the session cookie, removes that session from the server's
 * memory, and sends back an expired cookie so the browser deletes it.
 * Works even without a valid cookie (still responds success).
 *
 * Response: { success: true, message: "Logged out" }.
 */
router.post(['/logout', '/logout/'], async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const sessionId = cookies.sessionId;
    // Forget the session server-side (if the browser sent one).
    if (sessionId) sessions.delete(sessionId);

    // Max-Age=0 tells the browser to remove the cookie immediately.
    res.setHeader('Set-Cookie', 'sessionId=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
    return res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/auth/me — "who am I?"
 *
 * Uses the session cookie to find the logged-in user and returns their
 * public profile. Returns 401 "Not authenticated" if the cookie is
 * missing/expired or if the user behind it no longer exists.
 *
 * Request body: none.
 * Response: { success: true, data: { id, username, email } }.
 */
router.get(['/me', '/me/'], async (req, res) => {
  try {
    // Identify the caller purely from their session cookie.
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // The session exists but the account may have been removed since.
    const user = await findUserById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
