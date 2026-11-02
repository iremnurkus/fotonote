import type { Metadata } from "next";
import AuthGate from "@/components/AuthGate";
import Notebook from "@/components/Notebook";

export const metadata: Metadata = { title: "Defter · Fotonote" };

export default function DefterPage() {
  return (
    <main className="flex-1">
      <AuthGate>
        <Notebook />
      </AuthGate>
    </main>
  );
}
