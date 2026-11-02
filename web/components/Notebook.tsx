"use client";

import { useEffect, useState } from "react";
import {
  compressImage,
  emptyStore,
  loadStore,
  saveStore,
  type Page,
  type Store,
} from "@/lib/notes";
import Icon from "./Icon";
import PhotoPageView from "./PhotoPageView";
import TextPageView from "./TextPageView";

export default function Notebook() {
  const [store, setStore] = useState<Store>(emptyStore);
  const [ready, setReady] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleSection = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStore(loadStore());
    setReady(true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ready) setSaveFailed(!saveStore(store));
  }, [store, ready]);

  // activeId boşsa hiçbir sayfa açık değildir (kapatılmış).
  const wsId = store.activeWorkspaceId;
  const workspace =
    store.workspaces.find((w) => w.id === wsId) ?? store.workspaces[0];
  const pages = store.pages.filter((p) => p.workspaceId === workspace.id);
  const groups = store.groups.filter((g) => g.workspaceId === workspace.id);
  const current = pages.find((p) => p.id === store.activeId);

  function open(id: string | null) {
    setStore((s) => ({ ...s, activeId: id }));
  }

  function addGroup() {
    const name = prompt("Albüm adı")?.trim();
    if (!name) return;
    setStore((s) => ({
      ...s,
      groups: [
        ...s.groups,
        { id: crypto.randomUUID(), workspaceId: workspace.id, name },
      ],
    }));
  }

  function renameGroup(id: string, currentName: string) {
    const name = prompt("Albüm adı", currentName)?.trim();
    if (!name) return;
    setStore((s) => ({
      ...s,
      groups: s.groups.map((g) => (g.id === id ? { ...g, name } : g)),
    }));
  }

  // Albüm silinince sayfalar silinmez, albümsüz kalır.
  function deleteGroup(id: string, name: string) {
    if (
      !confirm(
        `"${name}" albümü silinsin mi? İçindeki sayfalar albümsüz kalır.`,
      )
    )
      return;
    setStore((s) => ({
      ...s,
      groups: s.groups.filter((g) => g.id !== id),
      pages: s.pages.map((p) =>
        p.groupId === id ? { ...p, groupId: null } : p,
      ),
    }));
  }

  function updatePage(page: Page) {
    setStore((s) => ({
      ...s,
      pages: s.pages.map((p) => (p.id === page.id ? page : p)),
    }));
  }

  function deletePage(id: string) {
    if (!confirm("Bu sayfa ve içindeki notlar silinsin mi?")) return;
    setStore((s) => ({
      ...s,
      pages: s.pages.filter((p) => p.id !== id),
      activeId: null,
    }));
  }

  // Yeni sayfa, açık sayfanın albümüne eklenir.
  const base = { workspaceId: workspace.id, groupId: current?.groupId ?? null };

  async function addPhotos(files: FileList | File[] | null | undefined) {
    const images = Array.from(files ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (!images.length) return;
    const added: Page[] = [];
    for (const file of images) {
      try {
        added.push({
          id: crypto.randomUUID(),
          kind: "photo",
          title: "",
          src: await compressImage(file),
          pins: [],
          ...base,
        });
      } catch {
        // okunamayan dosyayı atla
      }
    }
    if (!added.length) return;
    setStore((s) => ({
      ...s,
      pages: [...s.pages, ...added],
      activeId: added.at(-1)!.id,
    }));
  }

  function addText() {
    const page: Page = {
      id: crypto.randomUUID(),
      kind: "text",
      title: "",
      text: "",
      ...base,
    };
    setStore((s) => ({ ...s, pages: [...s.pages, page], activeId: page.id }));
  }

  const photoInput = (
    <input
      type="file"
      accept="image/*"
      multiple
      className="hidden"
      onChange={(e) => {
        void addPhotos(e.target.files);
        e.target.value = "";
      }}
    />
  );

  const label = (p: Page) =>
    p.title.trim() ||
    `${p.kind === "photo" ? "Fotoğraf" : "Not"} ${pages.indexOf(p) + 1}`;
  const hasPages = pages.length > 0;
  const showNav = hasPages && !!current;

  const renderItem = (p: Page) => {
    const isCurrent = p.id === current?.id;
    return (
      <li key={p.id} className="w-36 shrink-0 lg:w-auto">
        <button
          type="button"
          onClick={() => open(p.id)}
          aria-current={isCurrent ? "page" : undefined}
          title={label(p)}
          className={`block w-full overflow-hidden rounded-lg border bg-white text-left transition ${
            isCurrent
              ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/25"
              : "border-[var(--line)] hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-lg)]"
          }`}
        >
          {p.kind === "photo" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.src}
              alt=""
              className="aspect-[4/3] w-full border-b border-[var(--line)] object-cover"
              draggable={false}
            />
          ) : (
            <div className="line-clamp-4 aspect-[4/3] w-full overflow-hidden border-b border-[var(--line)] bg-[var(--subtle)] p-2 text-xs leading-tight text-[var(--muted)]">
              {p.text || "Boş not"}
            </div>
          )}
          <span
            className={`block truncate px-2 py-1.5 text-xs font-medium ${
              isCurrent ? "bg-[var(--accent-soft)] text-[var(--accent)]" : ""
            }`}
          >
            {label(p)}
          </span>
        </button>
      </li>
    );
  };

  const sections: { id: string | null; name: string; items: Page[] }[] = [
    ...groups.map((g) => ({
      id: g.id,
      name: g.name,
      items: pages.filter((p) => p.groupId === g.id),
    })),
    {
      id: null,
      name: "Albümsüz",
      items: pages.filter((p) => !groups.some((g) => g.id === p.groupId)),
    },
  ];

  return (
    <div className="flex min-h-dvh w-full flex-col gap-5 p-4 lg:h-dvh lg:p-6">
      {saveFailed && (
        <div className="box shrink-0 border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          Defter tarayıcı depolamasına sığmadı; sayfa yenilenince bazı
          değişiklikler kaybolabilir.
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] lg:grid-rows-[minmax(0,1fr)] lg:gap-6">
        <div className={`relative z-40 lg:order-1 ${showNav ? "h-14" : ""}`}>
          {showNav && (
            <nav
              aria-label="Albüm"
              tabIndex={0}
              className="album-dock box absolute left-0 top-0 flex flex-col"
            >
              <div className="box-head">
                <Icon name="folder" className="album-icon h-4 w-4" />
                <span className="album-label">Albüm · {pages.length}</span>
              </div>
              <div className="album-body">
                <div className="album-scroll p-4">
                  <ul className="flex gap-4 overflow-x-auto lg:flex-col lg:overflow-x-hidden">
                    {pages.map(renderItem)}
                  </ul>
                </div>
              </div>
            </nav>
          )}
        </div>

        <div className="relative z-40 lg:order-3 lg:col-start-3">
          <aside
            aria-label="Araçlar"
            className="tool-rail lg:absolute lg:right-0 lg:top-0"
          >
            <div className="hidden flex-col items-end gap-2 lg:flex">
              <button
                type="button"
                onClick={() => open(null)}
                aria-label="Ana sayfa"
                title="Ana sayfa"
                className="rail-brand"
              >
                F
              </button>
              <label
                className="rail-action rail-action-primary"
                title="Fotoğraf ekle"
              >
                <Icon name="image" />
                <span className="rail-action-label">Fotoğraf ekle</span>
                {photoInput}
              </label>
              <button
                type="button"
                onClick={addText}
                className="rail-action"
                title="Yazılı not ekle"
              >
                <Icon name="text" />
                <span className="rail-action-label">Yazılı not ekle</span>
              </button>
            </div>

            <div className="box flex flex-col lg:hidden">
              <div className="flex items-center gap-3 border-b border-[var(--line)] p-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--ink)] text-lg font-bold text-white">
                  F
                </span>
                <div className="leading-tight">
                  <h1 className="text-xl font-black tracking-tight">
                    Fotonote
                  </h1>
                  <p className="text-xs text-[var(--muted)]">
                    tam noktasına not düş
                  </p>
                </div>
              </div>
              <div className="box-head">
                <span>Araçlar</span>
              </div>
              <div className="flex flex-col gap-2 p-3">
                <label className="btn btn-primary">
                  + Fotoğraf
                  {photoInput}
                </label>
                <button type="button" onClick={addText} className="btn">
                  + Yazılı not
                </button>
              </div>
            </div>
          </aside>
        </div>

        <section className="flex min-h-0 min-w-0 flex-col lg:order-2 lg:col-start-2">
          {!current ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void addPhotos(e.dataTransfer.files);
              }}
              className={`flex min-h-[20rem] flex-1 flex-col gap-8 overflow-y-auto rounded-lg border border-dashed p-6 transition ${
                dragging
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--line-strong)]"
              }`}
            >
              <div className="flex flex-wrap items-center justify-center gap-4">
                <label className="btn btn-primary h-12 cursor-pointer px-5">
                  <Icon name="image" />
                  Fotoğraf ekle
                  {photoInput}
                </label>
                <button
                  type="button"
                  onClick={addText}
                  className="btn h-12 px-5"
                >
                  <Icon name="text" />
                  Yazılı not ekle
                </button>
              </div>

              <section aria-label="Albüm" className="flex flex-col gap-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xs font-semibold tracking-wide text-[var(--muted)]">
                    Albüm · {pages.length}
                  </h2>
                  <button
                    type="button"
                    onClick={addGroup}
                    className="btn h-9 px-3"
                    title="Albüm ekle"
                  >
                    <Icon name="plus" />
                    Albüm
                  </button>
                </div>
                {sections.map((sec) => {
                  if (
                    sec.id === null &&
                    groups.length > 0 &&
                    sec.items.length === 0
                  )
                    return null;
                  if (sec.id === null && sec.items.length === 0) return null;
                  const key = sec.id ?? "none";
                  const isCollapsed = collapsed.has(key);
                  return (
                    <section
                      key={key}
                      data-collapsed={isCollapsed}
                      className="group-section flex flex-col"
                    >
                      {groups.length > 0 && (
                        <div className="group-heading">
                          <button
                            type="button"
                            onClick={() => toggleSection(key)}
                            aria-expanded={!isCollapsed}
                            title={isCollapsed ? "Aç" : "Kapat"}
                            className="group-toggle"
                          >
                            <Icon
                              name="chevron"
                              className="group-chevron h-4 w-4"
                            />
                            <span className="truncate">
                              {sec.name} · {sec.items.length}
                            </span>
                          </button>
                          {sec.id && (
                            <span className="group-heading-actions">
                              <button
                                type="button"
                                onClick={() => renameGroup(sec.id!, sec.name)}
                                aria-label="Albümü yeniden adlandır"
                                title="Albümü yeniden adlandır"
                                className="group-action"
                              >
                                <Icon name="edit" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteGroup(sec.id!, sec.name)}
                                aria-label="Albümü sil"
                                title="Albümü sil"
                                className="group-action group-action-danger"
                              >
                                <Icon name="trash" />
                              </button>
                            </span>
                          )}
                        </div>
                      )}
                      <div className="group-body" inert={isCollapsed}>
                        <ul className="grid grid-cols-2 gap-4 pt-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                          {sec.items.map(renderItem)}
                          {sec.items.length === 0 && (
                            <li className="col-span-full rounded-lg border border-dashed border-[var(--line-strong)] p-3 text-center text-xs text-[var(--muted)]">
                              Boş albüm. Bir sayfayı açıp alttaki albüm
                              butonundan buraya taşı.
                            </li>
                          )}
                        </ul>
                      </div>
                    </section>
                  );
                })}
              </section>
            </div>
          ) : current.kind === "photo" ? (
            <PhotoPageView
              key={current.id}
              page={current}
              groups={groups}
              showPreviews={store.showPreviews}
              onTogglePreviews={() =>
                setStore((s) => ({ ...s, showPreviews: !s.showPreviews }))
              }
              onChange={updatePage}
              onDelete={() => deletePage(current.id)}
              onClose={() => open(null)}
            />
          ) : (
            <TextPageView
              key={current.id}
              page={current}
              groups={groups}
              onChange={updatePage}
              onDelete={() => deletePage(current.id)}
              onClose={() => open(null)}
            />
          )}
        </section>
      </div>
    </div>
  );
}
