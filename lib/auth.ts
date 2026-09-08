let _cookie: string | null = null;
let _studentId: number | null = null;

export interface AuthState {
  cookie: string | null;
  studentId: number | null;
}

export function setAuth(cookie: string, studentId: number): void {
  _cookie = cookie;
  _studentId = studentId;
}

export function getAuth(): AuthState {
  return { cookie: _cookie, studentId: _studentId };
}

export function clearAuth(): void {
  _cookie = null;
  _studentId = null;
}

export function isLoggedIn(): boolean {
  return !!_cookie && !!_studentId;
}
