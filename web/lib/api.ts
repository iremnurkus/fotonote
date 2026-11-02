import { auth } from "./firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5077";

// .NET API'sine Firebase ID token'ı ile istek atar.
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await auth?.currentUser?.getIdToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}
