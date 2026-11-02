import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = { title: "Giriş yap · Fotonote" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
