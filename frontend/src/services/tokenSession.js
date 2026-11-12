// 클라이언트에서는 만료 여부만 확인하고, 토큰 서명은 서버에서 검증합니다.

/** 토큰 payload의 만료 시각만 검사합니다. 서명 검증은 서버에서 수행합니다. */
export function isTokenExpired(token, now = Date.now()) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "=")));
    return !Number.isFinite(claims.exp) || claims.exp * 1000 <= now;
  } catch {
    return true;
  }
}
