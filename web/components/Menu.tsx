"use client";

import { useEffect, useId, useRef, useState } from "react";
import Icon, { type IconName } from "./Icon";

type Option = { value: string; label: string };

type Props = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  icon: IconName;
  ariaLabel: string;
  triggerClassName: string;
  labelClassName: string;
  placement: "above" | "below";
};

// Yerel <select> yerine, sayfanın temasına uyan açılır seçim listesi.
export default function Menu({ value, options, onChange, icon, ariaLabel, triggerClassName, labelClassName, placement }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  function move(step: 1 | -1) {
    const items = Array.from(root.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
    const index = items.indexOf(document.activeElement as HTMLElement);
    items[(index + step + items.length) % items.length]?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
      root.current?.querySelector<HTMLElement>("button")?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus());
      } else {
        move(e.key === "ArrowDown" ? 1 : -1);
      }
    }
  }

  return (
    <div ref={root} className="menu" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-label={`${ariaLabel}: ${selected?.label ?? ""}`}
        title={`${ariaLabel}: ${selected?.label ?? ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((o) => !o)}
        className={triggerClassName}
      >
        <Icon name={icon} />
        <span className={labelClassName}>{selected?.label}</span>
      </button>
      {open && (
        <ul id={listId} role="listbox" aria-label={ariaLabel} className={`menu-list menu-list-${placement}`}>
          {options.map((o) => (
            <li key={o.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                  root.current?.querySelector<HTMLElement>("button")?.focus();
                }}
                className="menu-option"
              >
                <span className="truncate">{o.label}</span>
                {o.value === value && <Icon name="check" className="h-4 w-4 shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
