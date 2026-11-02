"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authErrorMessage, useAuth } from "@/lib/auth";
import Logo from "./Logo";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const { configured, signIn, signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isSignup) await signUp(name.trim(), email.trim(), password);
      else await signIn(email.trim(), password);
      router.replace("/defter");
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 p-4">
      <Logo />
      <form onSubmit={submit} className="box flex w-full max-w-sm flex-col">
        <div className="box-head">
          <span>{isSignup ? "Kayıt ol" : "Giriş yap"}</span>
        </div>
        <div className="flex flex-col gap-4 p-5">
          {!configured && (
            <p className="rounded border border-[var(--line-strong)] bg-[var(--subtle)] p-3 text-sm text-[var(--muted)]">
              Hesap sistemi henüz yapılandırılmadı. Deftere misafir olarak
              girebilirsin.
            </p>
          )}

          {isSignup && (
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Ad
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="field"
              />
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            E-posta
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="field"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Şifre
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="field"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm font-medium text-[var(--danger)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !configured}
            className="btn btn-primary h-11 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Bekleniyor..." : isSignup ? "Hesap oluştur" : "Giriş yap"}
          </button>

          {!configured && (
            <Link href="/defter" className="btn h-11">
              Misafir olarak devam et
            </Link>
          )}

          <p className="text-center text-sm text-[var(--muted)]">
            {isSignup ? "Zaten hesabın var mı? " : "Hesabın yok mu? "}
            <Link
              href={isSignup ? "/giris" : "/kayit"}
              className="font-bold text-[var(--ink)] underline underline-offset-2"
            >
              {isSignup ? "Giriş yap" : "Kayıt ol"}
            </Link>
          </p>
        </div>
      </form>
    </main>
  );
}
