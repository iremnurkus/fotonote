import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getBytes,
  ref,
  uploadString,
} from "firebase/storage";
import { auth, db, storage } from "./firebase";
import { emptyStore, type Page, type PhotoPage, type Store, type TextPage } from "./notes";

type StoredPhotoPage = Omit<PhotoPage, "src"> & { storagePath: string };
type StoredPage = StoredPhotoPage | TextPage;
type NotebookMetadata = Omit<Store, "pages"> & {
  pendingStorageDeletes?: string[];
};

function getServices(uid: string) {
  if (!db || !storage || auth?.currentUser?.uid !== uid) {
    throw new Error("Hesap doğrulanamadı veya Firebase yapılandırması eksik.");
  }
  return { db, storage };
}

function photoPath(uid: string, pageId: string): string {
  return `users/${uid}/notes/${pageId}.jpg`;
}

function bytesToDataUrl(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return `data:image/jpeg;base64,${btoa(binary)}`;
}

function metadataFor(store: Store, pendingStorageDeletes: string[]): NotebookMetadata {
  return {
    workspaces: store.workspaces,
    activeWorkspaceId: store.activeWorkspaceId,
    groups: store.groups,
    activeId: store.activeId,
    showPreviews: store.showPreviews,
    pendingStorageDeletes,
  };
}

export async function loadUserStore(uid: string): Promise<Store | null> {
  const { db, storage } = getServices(uid);
  const metadataRef = doc(db, "users", uid, "notebook", "data");
  const pagesRef = collection(db, "users", uid, "notebook", "data", "pages");
  const [metadataSnapshot, pagesSnapshot] = await Promise.all([
    getDoc(metadataRef),
    getDocs(pagesRef),
  ]);

  if (!metadataSnapshot.exists() && pagesSnapshot.empty) return null;

  const metadata = metadataSnapshot.data() as Partial<NotebookMetadata> | undefined;
  const pages = await Promise.all(
    pagesSnapshot.docs.map(async (snapshot): Promise<Page> => {
      const page = snapshot.data() as StoredPage;
      if (page.id !== snapshot.id || (page.kind !== "photo" && page.kind !== "text")) {
        throw new Error("Bulut defterinde geçersiz bir sayfa bulundu.");
      }
      if (page.kind === "text") return page;

      const expectedPath = photoPath(uid, page.id);
      if (page.storagePath !== expectedPath) {
        throw new Error("Fotoğrafın saklama yolu geçersiz.");
      }
      const bytes = await getBytes(ref(storage, expectedPath));
      return { ...page, src: bytesToDataUrl(bytes) };
    }),
  );

  return {
    ...emptyStore,
    ...metadata,
    pages,
  };
}

export async function saveUserStore(
  uid: string,
  store: Store,
): Promise<{ store: Store; cleanupPending: boolean }> {
  const { db, storage } = getServices(uid);
  const metadataRef = doc(db, "users", uid, "notebook", "data");
  const pagesRef = collection(db, "users", uid, "notebook", "data", "pages");
  const [metadataSnapshot, previousPages] = await Promise.all([
    getDoc(metadataRef),
    getDocs(pagesRef),
  ]);

  const previousMetadata = metadataSnapshot.data() as
    | Partial<NotebookMetadata>
    | undefined;
  const previousPending = Array.isArray(previousMetadata?.pendingStorageDeletes)
    ? previousMetadata.pendingStorageDeletes.filter(
        (path): path is string => typeof path === "string",
      )
    : [];
  const pageIds = new Set(store.pages.map((page) => page.id));
  const removedPaths = previousPages.docs.flatMap((snapshot) => {
    if (pageIds.has(snapshot.id)) return [];
    const page = snapshot.data() as Partial<StoredPhotoPage>;
    return typeof page.storagePath === "string" ? [page.storagePath] : [];
  });
  const pendingPaths = [
    ...new Set([
      ...previousPending,
      ...removedPaths.filter((path) => path.startsWith(`users/${uid}/notes/`)),
    ]),
  ];

  const savedPages = await Promise.all(
    store.pages.map(async (page): Promise<StoredPage> => {
      if (page.kind === "text") return page;

      const path = photoPath(uid, page.id);
      if (page.storagePath !== path) {
        await uploadString(ref(storage, path), page.src, "data_url", {
          contentType: "image/jpeg",
        });
      }
      return {
        id: page.id,
        workspaceId: page.workspaceId,
        groupId: page.groupId,
        kind: "photo",
        title: page.title,
        pins: page.pins,
        storagePath: path,
      };
    }),
  );
  const savedStore: Store = {
    ...store,
    pages: store.pages.map((page) =>
      page.kind === "photo"
        ? { ...page, storagePath: photoPath(uid, page.id) }
        : page,
    ),
  };

  await Promise.all([
    setDoc(metadataRef, metadataFor(store, pendingPaths)),
    ...savedPages.map((page) =>
      setDoc(doc(pagesRef, page.id), page),
    ),
    ...previousPages.docs
      .filter((snapshot) => !pageIds.has(snapshot.id))
      .map((snapshot) => deleteDoc(snapshot.ref)),
  ]);

  const cleanupResults = await Promise.allSettled(
    pendingPaths.map(async (path) => {
      try {
        await deleteObject(ref(storage, path));
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "storage/object-not-found"
        ) {
          return;
        }
        throw error;
      }
    }),
  );
  const remainingPaths = pendingPaths.filter(
    (_, index) => cleanupResults[index].status === "rejected",
  );
  if (remainingPaths.length !== pendingPaths.length) {
    await setDoc(metadataRef, metadataFor(store, remainingPaths));
  }

  return { store: savedStore, cleanupPending: remainingPaths.length > 0 };
}
