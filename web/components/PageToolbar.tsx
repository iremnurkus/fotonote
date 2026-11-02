"use client";

import type { Group } from "@/lib/notes";
import Icon from "./Icon";
import Menu from "./Menu";

type Props = {
  title: string;
  onTitle: (title: string) => void;
  groups: Group[];
  groupId: string | null;
  onGroup: (groupId: string | null) => void;
  onClose: () => void;
  onDelete: () => void;
  children?: React.ReactNode;
};

export default function PageToolbar({ title, onTitle, groups, groupId, onGroup, onClose, onDelete, children }: Props) {
  return (
    <div className="relative z-20 shrink-0">
      <div className="toolbar-dock">
        <label className="toolbar-title-action" title="Başlığı düzenle">
          <Icon name="edit" className="toolbar-title-icon h-4 w-4" />
          <span className="sr-only">Başlık</span>
          <input
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            placeholder="Başlık ekle..."
            aria-label="Sayfa başlığı"
            className="toolbar-title"
          />
        </label>
        <Menu
          value={groupId ?? ""}
          options={[{ value: "", label: "Albümsüz" }, ...groups.map((g) => ({ value: g.id, label: g.name }))]}
          onChange={(v) => onGroup(v || null)}
          icon="folder"
          ariaLabel="Albüm"
          triggerClassName="toolbar-action"
          labelClassName="toolbar-action-label"
          placement="above"
        />
        <div className="toolbar-actions">
          {children}
          <button type="button" onClick={onDelete} aria-label="Sayfayı sil" title="Sayfayı sil" className="toolbar-action toolbar-action-danger">
            <Icon name="trash" />
            <span className="toolbar-action-label">Sil</span>
          </button>
          <button type="button" onClick={onClose} aria-label="Sayfayı kapat" title="Sayfayı kapat" className="toolbar-action">
            <Icon name="close" />
            <span className="toolbar-action-label">Kapat</span>
          </button>
        </div>
      </div>
    </div>
  );
}
