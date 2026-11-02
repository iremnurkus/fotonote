import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import Logo from "@/components/Logo";

const features: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "image",
    title: "Tam noktasına not",
    text: "Fotoğrafın üzerinde herhangi bir yere dokun, o noktaya numaralı bir not iğnele.",
  },
  {
    icon: "text",
    title: "Yazılı notlar",
    text: "Fotoğrafsız, sadece yazıdan oluşan sayfalar da açabilirsin.",
  },
  {
    icon: "folder",
    title: "Albümlerle düzen",
    text: "Sayfalarını albümlere ayır, albümleri açıp kapatarak düzenli tut.",
  },
];

const steps = [
  "Bir fotoğraf yükle ya da yazılı bir sayfa aç.",
  "Fotoğrafta not eklemek istediğin noktaya tıkla.",
  "Notunu yaz, sayfayı bir albüme koy.",
];

export default function Landing() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 p-4 lg:p-6">
      <header className="flex items-center justify-between gap-4">
        <Logo />
        <nav className="flex items-center gap-3">
          <Link href="/giris" className="btn">
            Giriş yap
          </Link>
          <Link href="/kayit" className="btn btn-primary">
            Kayıt ol
          </Link>
        </nav>
      </header>

      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <h1 className="text-4xl font-black leading-tight tracking-tight lg:text-5xl">
            Fotoğrafların üzerine, tam olduğu noktaya not ekle.
          </h1>
          <p className="text-lg text-[var(--muted)]">
            Fotonote ile bir fotoğrafta neyin nerede olduğunu unutma. Notlarını
            görselin üzerine iğnele, albümlerde topla.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/kayit" className="btn btn-primary h-12 px-6">
              Ücretsiz başla
            </Link>
            <Link href="/defter" className="btn h-12 px-6">
              Deftere git
            </Link>
          </div>
        </div>

        <div className="box" aria-hidden="true">
          <div className="box-head">
            <span>Fotoğraf</span>
            <span>3 not</span>
          </div>
          <div className="relative aspect-[4/3] bg-gradient-to-br from-[#e8d9c5] via-[#c9a77f] to-[#7a5a3a]">
            <span className="pin" style={{ left: "calc(22% - 1rem)", top: "calc(30% - 1rem)" }}>
              1
            </span>
            <span className="pin" style={{ left: "calc(58% - 1rem)", top: "calc(55% - 1rem)" }}>
              2
            </span>
            <span className="pin" style={{ left: "calc(80% - 1rem)", top: "calc(25% - 1rem)" }}>
              3
            </span>
            <span className="pin-preview" style={{ left: "58%", top: "55%", transform: "translate(1.5rem, -50%)" }}>
              <span className="line-clamp-2">Bu köşede bir kapı var</span>
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {features.map((f) => (
          <article key={f.title} className="box flex flex-col gap-3 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded border border-[var(--line)] bg-[var(--subtle)] text-[var(--accent)]">
              <Icon name={f.icon} className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-bold">{f.title}</h2>
            <p className="text-sm text-[var(--muted)]">{f.text}</p>
          </article>
        ))}
      </section>

      <section className="box">
        <div className="box-head">
          <span>Nasıl çalışır?</span>
        </div>
        <ol className="grid gap-6 p-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s} className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white">
                {i + 1}
              </span>
              <p className="text-sm">{s}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] py-6 text-sm text-[var(--muted)]">
        <span>© Fotonote</span>
        <span>Web ve mobil için</span>
      </footer>
    </main>
  );
}
