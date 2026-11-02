"use client";

import { useRef, useState } from "react";
import type { Group, PhotoPage, Pin } from "@/lib/notes";
import Icon from "./Icon";
import PageToolbar from "./PageToolbar";

type Props = {
  page: PhotoPage;
  groups: Group[];
  showPreviews: boolean;
  onTogglePreviews: () => void;
  onChange: (page: PhotoPage) => void;
  onDelete: () => void;
  onClose: () => void;
};

export default function PhotoPageView({
  page,
  groups,
  showPreviews,
  onTogglePreviews,
  onChange,
  onDelete,
  onClose,
}: Props) {
  const [activeId, setActiveIdRaw] = useState<string | null>(null);
  const [win, setWin] = useState<"open" | "min" | "closed">("open");

  function setActiveId(id: string | null) {
    setActiveIdRaw(id);
    if (id) setWin("open");
  }
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const winRef = useRef<HTMLElement>(null);
  const grab = useRef<{ dx: number; dy: number } | null>(null);

  function startDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (!winRef.current) return;
    const rect = winRef.current.getBoundingClientRect();
    grab.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function moveDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (!grab.current || !winRef.current) return;
    const { width, height } = winRef.current.getBoundingClientRect();
    setPos({
      x: Math.min(
        Math.max(0, e.clientX - grab.current.dx),
        window.innerWidth - width,
      ),
      y: Math.min(
        Math.max(0, e.clientY - grab.current.dy),
        window.innerHeight - height,
      ),
    });
  }

  function endDrag() {
    grab.current = null;
  }

  const dragProps = {
    onPointerDown: startDrag,
    onPointerMove: moveDrag,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };

  const active = page.pins.find((p) => p.id === activeId);

  function addPin(e: React.MouseEvent<HTMLDivElement>) {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const pin: Pin = {
      id: crypto.randomUUID(),
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      text: "",
    };
    onChange({ ...page, pins: [...page.pins, pin] });
    setActiveId(pin.id);
  }

  function updatePin(id: string, text: string) {
    onChange({
      ...page,
      pins: page.pins.map((p) => (p.id === id ? { ...p, text } : p)),
    });
  }

  function removePin(id: string) {
    onChange({ ...page, pins: page.pins.filter((p) => p.id !== id) });
    setActiveId(null);
  }

  const toolbar = (
    <PageToolbar
      title={page.title}
      onTitle={(title) => onChange({ ...page, title })}
      groups={groups}
      groupId={page.groupId}
      onGroup={(groupId) => onChange({ ...page, groupId })}
      onClose={onClose}
      onDelete={onDelete}
    >
      <button
        type="button"
        onClick={onTogglePreviews}
        aria-pressed={showPreviews}
        aria-label={`Not önizlemeleri ${showPreviews ? "açık" : "kapalı"}`}
        title={`Not önizlemeleri ${showPreviews ? "açık" : "kapalı"}`}
        className="toolbar-action"
      >
        <Icon name="eye" />
        <span className="toolbar-action-label">Önizleme</span>
      </button>
    </PageToolbar>
  );

  const winControls = (
    <span className="flex gap-1" onPointerDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setWin(win === "min" ? "open" : "min")}
        aria-label={win === "min" ? "Notlar penceresini büyüt" : "Notlar penceresini küçült"}
        title={win === "min" ? "Büyüt" : "Küçült"}
        className="group-action"
      >
        <Icon name={win === "min" ? "plus" : "minus"} />
      </button>
      <button
        type="button"
        onClick={() => {
          setActiveIdRaw(null);
          setWin("closed");
        }}
        aria-label="Notlar penceresini kapat"
        title="Kapat"
        className="group-action group-action-danger"
      >
        <Icon name="close" />
      </button>
    </span>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)]">
        <div className="box flex h-[70dvh] min-h-0 flex-col lg:h-auto relative">
          <div className="box-head">
            {/* <span>Fotoğraf</span> */}
            {/* <span>{page.pins.length === 0 ? "not eklemek için tıkla" : `${page.pins.length} not`}</span> */}
          </div>
          {/* Görsel, kalan alana oranını bozmadan sığar (container query birimleri) */}
          <div className="flex min-h-0 flex-1 items-center justify-center bg-[var(--bg)] p-4 [container-type:size]">
            <div
              ref={imgRef}
              onClick={addPin}
              className="relative w-fit cursor-crosshair select-none overflow-hidden rounded-md shadow-[var(--shadow-lg)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={page.src}
                alt={page.title || "Not eklenecek fotoğraf"}
                className="block h-auto max-h-[calc(100cqh-8px)] w-auto max-w-[calc(100cqw-8px)]"
                draggable={false}
              />

              {showPreviews &&
                page.pins.map((pin) =>
                  pin.text.trim() ? (
                    <button
                      key={`prev-${pin.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveId(pin.id);
                      }}
                      style={{
                        left: `${pin.x}%`,
                        top: `${pin.y}%`,
                        transform:
                          pin.x > 60
                            ? "translate(calc(-100% - 1.5rem), -50%)"
                            : "translate(1.5rem, -50%)",
                      }}
                      className="pin-preview"
                    >
                      <span className="line-clamp-2 break-words">
                        {pin.text}
                      </span>
                    </button>
                  ) : null,
                )}

              {page.pins.map((pin, i) => (
                <button
                  key={pin.id}
                  type="button"
                  title={pin.text || "Boş not"}
                  aria-current={pin.id === activeId}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveId(pin.id);
                  }}
                  style={{
                    left: `calc(${pin.x}% - 1rem)`,
                    top: `calc(${pin.y}% - 1rem)`,
                  }}
                  className="pin"
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
          <div className="toolbar-overlay">{toolbar}</div>
        </div>

        {win === "closed" && (
          <button
            type="button"
            onClick={() => setWin("open")}
            aria-label="Notlar penceresini aç"
            title="Notları aç"
            className="btn fixed bottom-6 right-6 z-30"
          >
            <Icon name="text" />
            {page.pins.length}
          </button>
        )}

        <aside
          ref={winRef}
          aria-label="Notlar"
          hidden={win === "closed"}
          style={pos ? { left: pos.x, top: pos.y } : { right: 24, bottom: 24 }}
          className="note-window box fixed z-30 flex max-h-[min(22rem,50dvh)] w-64 flex-col"
        >
          {active ? (
            <>
              <div className="box-head note-window-head" {...dragProps}>
                <span>Not {page.pins.indexOf(active) + 1}</span>
                {winControls}
              </div>
              <div hidden={win === "min"} className="flex min-h-0 flex-1 flex-col gap-2 p-2">
                <textarea
                  autoFocus
                  value={active.text}
                  onChange={(e) => updatePin(active.id, e.target.value)}
                  placeholder="Bu nokta hakkında..."
                  aria-label="Not metni"
                  className="textarea min-h-24 flex-1"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveId(null)}
                    className="btn btn-primary flex-1"
                  >
                    Tamam
                  </button>
                  <button
                    type="button"
                    onClick={() => removePin(active.id)}
                    className="btn btn-danger"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="box-head note-window-head" {...dragProps}>
                <span>Notlar · {page.pins.length}</span>
                {winControls}
              </div>
              {win !== "min" &&
                (page.pins.length === 0 ? (
                  <p className="p-3 text-sm text-[var(--muted)]">
                    Henüz not yok. Fotoğrafta bir noktaya tıkla.
                  </p>
                ) : (
                  <ol className="min-h-0 flex-1 overflow-y-auto">
                    {page.pins.map((p, i) => (
                      <li
                        key={p.id}
                        className="border-b border-[var(--line)] last:border-b-0"
                      >
                        <button
                          type="button"
                          onClick={() => setActiveId(p.id)}
                          className="flex w-full items-stretch text-left hover:bg-[var(--subtle)]"
                        >
                          <span className="flex w-10 shrink-0 items-center justify-center text-sm font-semibold text-[var(--accent)]">
                            {i + 1}
                          </span>
                          <span
                            className={`line-clamp-2 px-3 py-2 text-sm ${p.text ? "" : "text-[var(--muted)]"}`}
                          >
                            {p.text || "boş not"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                ))}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
