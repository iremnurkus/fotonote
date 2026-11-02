"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase";

type AuthState = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const messages: Record<string, string> = {
  "auth/invalid-credential": "E-posta ya da şifre hatalı.",
  "auth/user-not-found": "E-posta ya da şifre hatalı.",
  "auth/wrong-password": "E-posta ya da şifre hatalı.",
  "auth/invalid-email": "Geçerli bir e-posta adresi gir.",
  "auth/email-already-in-use": "Bu e-posta ile zaten bir hesap var.",
  "auth/weak-password": "Şifre en az 6 karakter olmalı.",
  "auth/too-many-requests": "Çok fazla deneme yapıldı, biraz sonra tekrar dene.",
  "auth/network-request-failed": "Bağlantı hatası, internetini kontrol et.",
};

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  return messages[code] ?? "Bir şeyler ters gitti, tekrar dene.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const value: AuthState = {
    user,
    loading,
    configured: isFirebaseConfigured,
    async signIn(email, password) {
      if (!auth) throw new Error("not-configured");
      await signInWithEmailAndPassword(auth, email, password);
    },
    async signUp(name, email, password) {
      if (!auth) throw new Error("not-configured");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(cred.user, { displayName: name });
    },
    async signOut() {
      if (auth) await firebaseSignOut(auth);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalı");
  return ctx;
}
