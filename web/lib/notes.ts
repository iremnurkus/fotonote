export type Pin = {
  id: string;
  // Fotoğrafın genişlik/yüksekliğine göre yüzde (0-100) konum; boyuta duyarlı kalır.
  x: number;
  y: number;
  text: string;
};

export type Workspace = { id: string; name: string };

export type Group = { id: string; workspaceId: string; name: string };

type PageBase = {
  id: string;
  workspaceId: string;
  groupId: string | null;
};

export type PhotoPage = PageBase & {
  kind: "photo";
  title: string;
  src: string;
  pins: Pin[];
  storagePath?: string;
};

export type TextPage = PageBase & {
  kind: "text";
  title: string;
  text: string;
};

export type Page = PhotoPage | TextPage;

export type Store = {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  groups: Group[];
  pages: Page[];
  activeId: string | null;
  showPreviews: boolean;
};

const KEY = "fotonote:v3";
const USER_KEY_PREFIX = "fotonote:user:v1:";
const V2_KEY = "fotonote:v2";
const LEGACY_KEY = "fotonote:photo";

const DEFAULT_WORKSPACE_ID = "personal";

export const emptyStore: Store = {
  workspaces: [{ id: DEFAULT_WORKSPACE_ID, name: "Kişisel" }],
  activeWorkspaceId: DEFAULT_WORKSPACE_ID,
  groups: [],
  pages: [],
  activeId: null,
  showPreviews: true,
};

type OldPage = (Omit<PhotoPage, "workspaceId" | "groupId"> | Omit<TextPage, "workspaceId" | "groupId">) &
  Partial<PageBase>;

function fromOld(pages: OldPage[], activeId: string | null, showPreviews = true): Store {
  return {
    ...emptyStore,
    showPreviews,
    activeId,
    pages: pages.map((p) => ({ ...p, workspaceId: DEFAULT_WORKSPACE_ID, groupId: null }) as Page),
  };
}

// Firebase (Firestore/Storage) bağlanana kadar geçici yerel kalıcılık.
export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyStore, ...(JSON.parse(raw) as Store) };

    const v2 = localStorage.getItem(V2_KEY);
    if (v2) {
      const old = JSON.parse(v2) as { pages?: OldPage[]; activeId?: string | null; showPreviews?: boolean };
      return fromOld(old.pages ?? [], old.activeId ?? null, old.showPreviews);
    }

    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as { src: string; pins: Pin[] };
      const page = { id: crypto.randomUUID(), kind: "photo" as const, title: "", ...old };
      return fromOld([page], page.id);
    }
  } catch {
    // bozuk veri: boş defterle başla
  }
  return emptyStore;
}

export function saveStore(store: Store): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
    localStorage.removeItem(LEGACY_KEY);
    localStorage.removeItem(V2_KEY);
    return true;
  } catch {
    return false;
  }
}

export function loadUserStoreCache(uid: string): Store | null {
  try {
    const raw = localStorage.getItem(
      `${USER_KEY_PREFIX}${encodeURIComponent(uid)}`,
    );
    return raw ? { ...emptyStore, ...(JSON.parse(raw) as Store) } : null;
  } catch {
    return null;
  }
}

export function saveUserStoreCache(uid: string, store: Store): boolean {
  try {
    localStorage.setItem(
      `${USER_KEY_PREFIX}${encodeURIComponent(uid)}`,
      JSON.stringify(store),
    );
    return true;
  } catch {
    return false;
  }
}

// Depolamaya sığması için fotoğrafı küçültüp JPEG olarak sıkıştırır.
export async function compressImage(file: File, maxSize = 1600): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}
