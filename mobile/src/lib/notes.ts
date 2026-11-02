import Storage from "expo-sqlite/kv-store";

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
  title: string;
};

export type PhotoPage = PageBase & {
  kind: "photo";
  // Uygulama belge klasöründeki dosya adı (iOS'ta mutlak yol değişebilir).
  file: string;
  ratio: number;
  pins: Pin[];
};

export type TextPage = PageBase & {
  kind: "text";
  text: string;
};

export type Page = PhotoPage | TextPage;

export type Store = {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  groups: Group[];
  pages: Page[];
  showPreviews: boolean;
};

const KEY = "fotonote:mobile:v1";
const DEFAULT_WORKSPACE_ID = "personal";

export const emptyStore: Store = {
  workspaces: [{ id: DEFAULT_WORKSPACE_ID, name: "Kişisel" }],
  activeWorkspaceId: DEFAULT_WORKSPACE_ID,
  groups: [],
  pages: [],
  showPreviews: true,
};

export function loadStore(): Store {
  try {
    const raw = Storage.getItemSync(KEY);
    if (raw) return { ...emptyStore, ...(JSON.parse(raw) as Store) };
  } catch {
    // bozuk veri: boş defterle başla
  }
  return emptyStore;
}

export function saveStore(store: Store) {
  Storage.setItemSync(KEY, JSON.stringify(store));
}
