// ============================================================
// Auth Router – lightweight session-based auth for the static app
// ============================================================
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, updateData } = require('../utils/dataStore');

const sessions = new Map();

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((acc, part) => {
    const [key, ...rest] = part.trim().split('=');
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

function getCurrentUserId(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies.sessionId ? sessions.get(cookies.sessionId) || null : null;
}

function writeSession(res, userId) {
  const sessionId = uuidv4();
  sessions.set(sessionId, userId);
  res.setHeader('Set-Cookie', `sessionId=${sessionId}; Path=/; HttpOnly; SameSite=Lax`);
  return sessionId;
}

async function findUserByUsername(username) {
  const users = await readData('users');
  return users.find(u => u.username.toLowerCase() === String(username || '').trim().toLowerCase()) || null;
}

async function findUserById(id) {
  const users = await readData('users');
  return users.find(u => u.id === id) || null;
}

router.post(['/register', '/register/'], async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    const email = String(req.body?.email || '').trim();
    const password = String(req.body?.password || '');

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'username and password are required' });
    }

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

    await updateData('users', users => [...users, user]);
    writeSession(res, user.id);

    return res.status(201).json({
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

router.post(['/login', '/login/'], async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'username and password are required' });
    }

    const user = await findUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

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

router.post(['/logout', '/logout/'], async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const sessionId = cookies.sessionId;
    if (sessionId) sessions.delete(sessionId);

    res.setHeader('Set-Cookie', 'sessionId=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
    return res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get(['/me', '/me/'], async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

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
