import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Fotonote ana sayfa">
      <span className="flex h-10 w-10 items-center justify-center rounded bg-[var(--ink)] text-lg font-bold text-white shadow-[0_3px_0_#000]">
        F
      </span>
      <span className="text-xl font-black tracking-tight">Fotonote</span>
    </Link>
  );
}
