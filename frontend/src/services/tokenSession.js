// This client check only detects expiry. Signature verification stays on the server.
export function isTokenExpired(token, now = Date.now()) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
    return !Number.isFinite(claims.exp) || claims.exp * 1000 <= now;
  } catch { return true; }
}
