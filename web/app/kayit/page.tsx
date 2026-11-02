import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = { title: "Kayıt ol · Fotonote" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
