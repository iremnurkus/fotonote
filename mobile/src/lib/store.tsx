import { randomUUID } from "expo-crypto";
import { File, Paths } from "expo-file-system";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { loadStore, saveStore, type Page, type PhotoPage, type Store, type TextPage } from "./notes";

export type PickedPhoto = { uri: string; width: number; height: number };

type Api = {
  store: Store;
  workspace: Store["workspaces"][number];
  pages: Page[];
  groups: Store["groups"];
  switchWorkspace: (id: string) => void;
  addWorkspace: (name: string) => void;
  renameWorkspace: (name: string) => void;
  deleteWorkspace: () => void;
  addGroup: (name: string) => void;
  renameGroup: (id: string, name: string) => void;
  deleteGroup: (id: string) => void;
  addPhotos: (photos: PickedPhoto[]) => string | null;
  addText: () => string;
  updatePage: (page: Page) => void;
  deletePage: (id: string) => void;
  setShowPreviews: (value: boolean) => void;
};

const Ctx = createContext<Api | null>(null);

export function photoUri(file: string) {
  return new File(Paths.document, file).uri;
}

function removeFile(file: string) {
  try {
    const f = new File(Paths.document, file);
    if (f.exists) f.delete();
  } catch {
    // dosya zaten yok
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(() => loadStore());
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    saveStore(store);
  }, [store]);

  const workspace = store.workspaces.find((w) => w.id === store.activeWorkspaceId) ?? store.workspaces[0];
  const pages = useMemo(() => store.pages.filter((p) => p.workspaceId === workspace.id), [store.pages, workspace.id]);
  const groups = useMemo(() => store.groups.filter((g) => g.workspaceId === workspace.id), [store.groups, workspace.id]);

  const addPhotos = useCallback(
    (photos: PickedPhoto[]) => {
      const added: PhotoPage[] = [];
      for (const photo of photos) {
        const id = randomUUID();
        const file = `${id}.jpg`;
        try {
          new File(photo.uri).copy(new File(Paths.document, file));
        } catch {
          continue;
        }
        added.push({
          id,
          kind: "photo",
          title: "",
          file,
          ratio: photo.width && photo.height ? photo.width / photo.height : 4 / 3,
          pins: [],
          workspaceId: workspace.id,
          groupId: null,
        });
      }
      if (!added.length) return null;
      setStore((s) => ({ ...s, pages: [...s.pages, ...added] }));
      return added[added.length - 1].id;
    },
    [workspace.id],
  );

  const addText = useCallback(() => {
    const page: TextPage = { id: randomUUID(), kind: "text", title: "", text: "", workspaceId: workspace.id, groupId: null };
    setStore((s) => ({ ...s, pages: [...s.pages, page] }));
    return page.id;
  }, [workspace.id]);

  const api: Api = {
    store,
    workspace,
    pages,
    groups,
    switchWorkspace: (id) => setStore((s) => ({ ...s, activeWorkspaceId: id })),
    addWorkspace: (name) => {
      const id = randomUUID();
      setStore((s) => ({ ...s, workspaces: [...s.workspaces, { id, name }], activeWorkspaceId: id }));
    },
    renameWorkspace: (name) =>
      setStore((s) => ({ ...s, workspaces: s.workspaces.map((w) => (w.id === workspace.id ? { ...w, name } : w)) })),
    deleteWorkspace: () => {
      if (store.workspaces.length < 2) return;
      store.pages.forEach((p) => {
        if (p.workspaceId === workspace.id && p.kind === "photo") removeFile(p.file);
      });
      setStore((s) => {
        const workspaces = s.workspaces.filter((w) => w.id !== workspace.id);
        return {
          ...s,
          workspaces,
          activeWorkspaceId: workspaces[0].id,
          groups: s.groups.filter((g) => g.workspaceId !== workspace.id),
          pages: s.pages.filter((p) => p.workspaceId !== workspace.id),
        };
      });
    },
    addGroup: (name) =>
      setStore((s) => ({ ...s, groups: [...s.groups, { id: randomUUID(), workspaceId: workspace.id, name }] })),
    renameGroup: (id, name) => setStore((s) => ({ ...s, groups: s.groups.map((g) => (g.id === id ? { ...g, name } : g)) })),
    // Grup silinince sayfalar silinmez, grupsuz kalır.
    deleteGroup: (id) =>
      setStore((s) => ({
        ...s,
        groups: s.groups.filter((g) => g.id !== id),
        pages: s.pages.map((p) => (p.groupId === id ? { ...p, groupId: null } : p)),
      })),
    addPhotos,
    addText,
    updatePage: (page) => setStore((s) => ({ ...s, pages: s.pages.map((p) => (p.id === page.id ? page : p)) })),
    deletePage: (id) => {
      const page = store.pages.find((p) => p.id === id);
      if (page?.kind === "photo") removeFile(page.file);
      setStore((s) => ({ ...s, pages: s.pages.filter((p) => p.id !== id) }));
    },
    setShowPreviews: (showPreviews) => setStore((s) => ({ ...s, showPreviews })),
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useNotes() {
  const api = useContext(Ctx);
  if (!api) throw new Error("useNotes yalnızca StoreProvider içinde kullanılabilir");
  return api;
}
