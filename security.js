const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { rateLimit } = require('express-rate-limit');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');

const SESSION_COOKIE = 'ai_bus_track_session';
const SESSION_AGE_MS = 2 * 60 * 60 * 1000;
const ISSUER = 'ai-bus-track';
const AUDIENCE = 'ai-bus-track-web';

function createSecurity({ usersFile, jwtSecret, secureCookie }) {
  if (!jwtSecret || jwtSecret.length < 32 || jwtSecret.startsWith('replace-with-')) {
    throw new Error('Set JWT_SECRET in your local .env file to a private random value of at least 32 characters.');
  }

  function readUsers() {
    try { return JSON.parse(fs.readFileSync(usersFile, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  }

  function writeUsers(users) {
    const temporaryFile = `${usersFile}.tmp`;
    fs.writeFileSync(temporaryFile, `${JSON.stringify(users, null, 2)}\n`, { mode: 0o600 });
    fs.renameSync(temporaryFile, usersFile);
    try { fs.chmodSync(usersFile, 0o600); } catch (_) { /* File permissions vary on some development filesystems. */ }
  }

  function publicUser(user) {
    return { id: user.id, name: user.name, email: user.email, role: user.role, busNos: user.busNos || [] };
  }

  function setSessionCookie(response, user) {
    const token = jwt.sign({ sub: user.id }, jwtSecret, {
      algorithm: 'HS256', expiresIn: '2h', issuer: ISSUER, audience: AUDIENCE
    });
    response.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_AGE_MS
    });
  }

  function clearSessionCookie(response) {
    response.clearCookie(SESSION_COOKIE, {
      httpOnly: true, secure: secureCookie, sameSite: 'strict', path: '/'
    });
  }

  function authenticate(request, response, next) {
    const token = request.cookies?.[SESSION_COOKIE];
    if (!token) return response.status(401).json({ error: 'Sign in to continue.' });
    try {
      const claims = jwt.verify(token, jwtSecret, {
        algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE
      });
      const user = readUsers().find(candidate => candidate.id === claims.sub && candidate.active !== false);
      if (!user) {
        clearSessionCookie(response);
        return response.status(401).json({ error: 'Your session is no longer valid. Please sign in again.' });
      }
      request.user = publicUser(user);
      next();
    } catch (_) {
      clearSessionCookie(response);
      return response.status(401).json({ error: 'Your session expired. Please sign in again.' });
    }
  }

  function allowRoles(...roles) {
    return (request, response, next) => {
      if (!request.user) return response.status(401).json({ error: 'Sign in to continue.' });
      if (!roles.includes(request.user.role)) return response.status(403).json({ error: 'This action is not allowed for your account role.' });
      next();
    };
  }

  const signInLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many sign-in attempts. Wait 15 minutes and try again.' }
  });
  const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many new accounts from this connection. Try again later.' }
  });

  const router = express.Router();
  router.post('/register', registerLimiter, async (request, response) => {
    const name = typeof request.body?.name === 'string' ? request.body.name.trim() : '';
    const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    if (name.length < 2 || name.length > 80) return response.status(400).json({ error: 'Name must be between 2 and 80 characters.' });
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response.status(400).json({ error: 'Enter a valid email address.' });
    if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) return response.status(400).json({ error: 'Use a password between 12 and 72 UTF-8 bytes.' });
    try {
      const users = readUsers();
      if (users.some(user => user.email === email)) return response.status(409).json({ error: 'An account with this email already exists.' });
      const passwordHash=await bcrypt.hash(password,12);
      const latestUsers=readUsers();
      if (latestUsers.some(user => user.email === email)) return response.status(409).json({ error: 'An account with this email already exists.' });
      const user = {
        id: randomUUID(), name, email, role: 'user', busNos: [], active: true,
        passwordHash, createdAt: new Date().toISOString()
      };
      latestUsers.push(user); writeUsers(latestUsers); setSessionCookie(response, user);
      return response.status(201).json({ user: publicUser(user) });
    } catch (error) {
      console.error('Account registration failed:', error.message);
      return response.status(500).json({ error: 'The account could not be created. Please try again.' });
    }
  });

  router.post('/login', signInLimiter, async (request, response) => {
    const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    try {
      const user = readUsers().find(candidate => candidate.email === email && candidate.active !== false);
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return response.status(401).json({ error: 'Email or password is incorrect.' });
      }
      setSessionCookie(response, user);
      return response.json({ user: publicUser(user) });
    } catch (error) {
      console.error('Sign-in failed:', error.message);
      return response.status(500).json({ error: 'Sign-in is temporarily unavailable.' });
    }
  });

  router.post('/logout', (_request, response) => {
    clearSessionCookie(response);
    response.status(204).end();
  });
  router.get('/me', authenticate, (request, response) => response.json({ user: request.user }));

  async function bootstrapAdmin(emailValue, password) {
    const email = String(emailValue || '').trim().toLowerCase();
    if (!email && !password) {
      if (readUsers().some(user => user.role === 'admin' && user.active !== false)) return;
      throw new Error('Set ADMIN_EMAIL and a strong ADMIN_PASSWORD in .env before the first start.');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.startsWith('replace-with-') || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
      throw new Error('ADMIN_EMAIL must be valid and ADMIN_PASSWORD must be 12 to 72 UTF-8 bytes. Check .env.');
    }
    const users = readUsers();
    if (users.some(user => user.role === 'admin')) {
      console.log('Admin account already exists; environment bootstrap was not used.');
      return;
    }
    if (users.some(user => user.email === email)) throw new Error('ADMIN_EMAIL is already used by a non-admin account. Choose another address.');
    users.push({
      id: randomUUID(), name: 'AI Bus Track Admin', email, role: 'admin', busNos: [], active: true,
      passwordHash: await bcrypt.hash(password, 12), createdAt: new Date().toISOString()
    });
    writeUsers(users);
    console.log(`Initial Admin account created for ${email}.`);
  }

  async function createDriver({ name, email, password, busNos }) {
    const safeName = typeof name === 'string' ? name.trim() : '';
    const safeEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (safeName.length < 2 || safeName.length > 80) throw new Error('Name must be between 2 and 80 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) throw new Error('Enter a valid email address.');
    if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) throw new Error('Driver password must be 12 to 72 UTF-8 bytes.');
    const users = readUsers();
    if (users.some(user => user.email === safeEmail)) throw new Error('An account with this email already exists.');
    const passwordHash=await bcrypt.hash(password,12);
    const latestUsers=readUsers();
    if(latestUsers.some(user=>user.email===safeEmail))throw new Error('An account with this email already exists.');
    const user = { id: randomUUID(), name: safeName, email: safeEmail, role: 'driver', busNos, active: true, passwordHash, createdAt: new Date().toISOString() };
    latestUsers.push(user); writeUsers(latestUsers);
    return publicUser(user);
  }

  return {
    router,
    authenticate,
    allowRoles,
    bootstrapAdmin,
    createDriver,
    listUsers: () => readUsers().map(publicUser)
  };
}

module.exports = { createSecurity };
