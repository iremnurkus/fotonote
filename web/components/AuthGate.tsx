"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect } from "react";
import { useAuth } from "@/lib/auth";

// Firebase yapılandırılmışsa giriş zorunlu; değilse misafir olarak açılır.
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  const blocked = configured && !user;

  useEffect(() => {
    if (!loading && blocked) router.replace("/giris");
  }, [loading, blocked, router]);

  if (loading || blocked) return null;
  return <Fragment key={user?.uid ?? "guest"}>{children}</Fragment>;
}
