"use client";

import type { Group, TextPage } from "@/lib/notes";
import PageToolbar from "./PageToolbar";

type Props = {
  page: TextPage;
  groups: Group[];
  onChange: (page: TextPage) => void;
  onDelete: () => void;
  onClose: () => void;
};

export default function TextPageView({ page, groups, onChange, onDelete, onClose }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="box relative flex min-h-[20rem] flex-1 flex-col">
        <div className="box-head">
          <span>Yazılı not</span>
          <span>{page.text.length} karakter</span>
        </div>
        <textarea
          autoFocus
          value={page.text}
          onChange={(e) => onChange({ ...page, text: e.target.value })}
          placeholder="Notunu buraya yaz..."
          aria-label="Not metni"
          className="textarea m-3 min-h-0 flex-1 pb-20 text-lg"
        />
        <div className="toolbar-overlay">
          <PageToolbar
            title={page.title}
            onTitle={(title) => onChange({ ...page, title })}
            groups={groups}
            groupId={page.groupId}
            onGroup={(groupId) => onChange({ ...page, groupId })}
            onClose={onClose}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
}
