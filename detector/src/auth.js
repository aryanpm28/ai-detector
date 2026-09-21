import api from './utils/api';

const TOKEN_KEY = 'ai_detector_token';
const USER_KEY = 'ai_detector_user';

// NOTE: this file used to store users and passwords directly in
// localStorage as a fake "auth" system. Everything below now goes
// through the real Express + MongoDB backend — localStorage only
// holds the JWT and a copy of the logged-in user's public profile,
// never a password.

export async function register(name, email, password) {
  try {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return { ok: true, user: data.user };
  } catch (err) {
    return { ok: false, error: err.response?.data?.message || 'Registration failed' };
  }
}

export async function login(email, password) {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return { ok: true, user: data.user };
  } catch (err) {
    return { ok: false, error: err.response?.data?.message || 'Login failed' };
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Synchronous read of the cached profile — used for quick UI checks
// (e.g. "is someone logged in" for route guarding). The real source
// of truth is always the backend; call verifySession() when you need
// to confirm the token is actually still valid.
export function getSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

// Confirms the stored token is still valid by asking the backend.
// Returns the fresh user object, or null if the token is missing/expired.
export async function verifySession() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  try {
    const { data } = await api.get('/auth/me');
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  } catch {
    logout();
    return null;
  }
}
