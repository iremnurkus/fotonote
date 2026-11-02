import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IconButton from "../components/IconButton";
import { ChoiceSheet, PromptSheet } from "../components/Sheet";
import { photoUri, useNotes } from "../lib/store";
import type { Page } from "../lib/notes";
import { colors, radius, space } from "../theme";

type PromptState =
  | { type: "ws-new" }
  | { type: "ws-rename" }
  | { type: "group-new" }
  | { type: "group-rename"; id: string; name: string }
  | null;

const GAP = 16;

export default function Album() {
  const notes = useNotes();
  const { workspace, pages, groups, store } = notes;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [wsOpen, setWsOpen] = useState(false);
  const [prompt, setPrompt] = useState<PromptState>(null);

  const cardWidth = (width - space.lg * 2 - GAP) / 2;

  const sections = [
    ...groups.map((g) => ({ id: g.id as string | null, name: g.name, items: pages.filter((p) => p.groupId === g.id) })),
    { id: null as string | null, name: "Grupsuz", items: pages.filter((p) => !groups.some((g) => g.id === p.groupId)) },
  ].filter((s) => s.id !== null || s.items.length > 0 || groups.length === 0);

  async function pickPhotos(source: "library" | "camera") {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      quality: 0.7,
      allowsMultipleSelection: source === "library",
    };
    if (source === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Kamera izni gerekli", "Fotoğraf çekmek için ayarlardan kamera iznini aç.");
        return;
      }
    }
    const result =
      source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    const id = notes.addPhotos(result.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height })));
    if (id) router.push(`/page/${id}`);
  }

  function newText() {
    router.push(`/page/${notes.addText()}`);
  }

  function confirmDeleteGroup(id: string, name: string) {
    Alert.alert(`"${name}" grubu silinsin mi?`, "İçindeki sayfalar silinmez, grupsuz kalır.", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => notes.deleteGroup(id) },
    ]);
  }

  function confirmDeleteWorkspace() {
    setWsOpen(false);
    Alert.alert(`"${workspace.name}" çalışma alanı silinsin mi?`, "İçindeki her şey silinir.", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: notes.deleteWorkspace },
    ]);
  }

  // iOS'ta bir modal kapanırken diğerini hemen açmak sorun çıkarır.
  function openPrompt(next: PromptState) {
    setWsOpen(false);
    setTimeout(() => setPrompt(next), 350);
  }

  function onPromptSubmit(value: string) {
    if (!prompt) return;
    if (prompt.type === "ws-new") notes.addWorkspace(value);
    else if (prompt.type === "ws-rename") notes.renameWorkspace(value);
    else if (prompt.type === "group-new") notes.addGroup(value);
    else notes.renameGroup(prompt.id, value);
  }

  const promptConfig = {
    "ws-new": { title: "Yeni çalışma alanı", initial: "" },
    "ws-rename": { title: "Çalışma alanı adı", initial: workspace.name },
    "group-new": { title: "Yeni grup", initial: "" },
    "group-rename": { title: "Grup adı", initial: prompt?.type === "group-rename" ? prompt.name : "" },
  } as const;

  const renderCard = (p: Page, index: number) => (
    <Pressable
      key={p.id}
      accessibilityRole="button"
      accessibilityLabel={p.title.trim() || (p.kind === "photo" ? "Fotoğraf" : "Not")}
      onPress={() => router.push(`/page/${p.id}`)}
      style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && styles.pressed]}
    >
      {p.kind === "photo" ? (
        <Image source={{ uri: photoUri(p.file) }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={[styles.thumb, styles.textThumb]}>
          <Text numberOfLines={5} style={styles.textThumbText}>
            {p.text || "Boş not"}
          </Text>
        </View>
      )}
      <Text numberOfLines={1} style={styles.cardLabel}>
        {p.title.trim() || `${p.kind === "photo" ? "Fotoğraf" : "Not"} ${index + 1}`}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Çalışma alanı: ${workspace.name}`}
              onPress={() => setWsOpen(true)}
              style={({ pressed }) => [styles.wsButton, pressed && styles.pressed]}
            >
              <Feather name="folder" size={18} color={colors.ink} />
              <Text numberOfLines={1} style={styles.wsText}>
                {workspace.name}
              </Text>
              <Feather name="chevron-down" size={18} color={colors.muted} />
            </Pressable>
          ),
          headerRight: () => (
            <IconButton icon="folder-plus" label="Grup ekle" size={40} onPress={() => setPrompt({ type: "group-new" })} />
          ),
        }}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 180 }]}
      >
        {pages.length === 0 && groups.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="image" size={40} color={colors.lineStrong} />
            <Text style={styles.emptyTitle}>Henüz sayfa yok</Text>
            <Text style={styles.emptyText}>Bir fotoğraf ekle ve tam istediğin noktaya not düş.</Text>
          </View>
        ) : (
          sections.map((sec) => (
            <View key={sec.id ?? "none"} style={styles.section}>
              {(groups.length > 0 || sec.id) && (
                <View style={styles.sectionHead}>
                  <Text numberOfLines={1} style={styles.sectionTitle}>
                    {sec.name} · {sec.items.length}
                  </Text>
                  {sec.id && (
                    <View style={styles.sectionActions}>
                      <IconButton
                        icon="edit-2"
                        label="Grubu yeniden adlandır"
                        size={40}
                        onPress={() => setPrompt({ type: "group-rename", id: sec.id!, name: sec.name })}
                      />
                      <IconButton
                        icon="trash-2"
                        label="Grubu sil"
                        size={40}
                        tone="danger"
                        onPress={() => confirmDeleteGroup(sec.id!, sec.name)}
                      />
                    </View>
                  )}
                </View>
              )}
              {sec.items.length === 0 ? (
                <Text style={styles.emptyGroup}>Boş grup. Bir sayfayı açıp bu gruba taşıyabilirsin.</Text>
              ) : (
                <View style={styles.grid}>{sec.items.map(renderCard)}</View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <View pointerEvents="box-none" style={[styles.actions, { bottom: insets.bottom + space.lg }]}>
        <IconButton icon="type" label="Yazılı not ekle" size={56} onPress={newText} />
        <IconButton icon="camera" label="Fotoğraf çek" size={56} onPress={() => pickPhotos("camera")} />
        <IconButton icon="image" label="Galeriden fotoğraf ekle" size={56} tone="primary" onPress={() => pickPhotos("library")} />
      </View>

      <ChoiceSheet
        visible={wsOpen}
        title="Çalışma alanı"
        options={store.workspaces.map((w) => ({ value: w.id, label: w.name }))}
        value={workspace.id}
        onSelect={notes.switchWorkspace}
        onClose={() => setWsOpen(false)}
        footer={
          <View style={styles.sheetActions}>
            <IconButton icon="plus" label="Yeni alan" showLabel onPress={() => openPrompt({ type: "ws-new" })} />
            <IconButton icon="edit-2" label="Adını değiştir" showLabel onPress={() => openPrompt({ type: "ws-rename" })} />
            {store.workspaces.length > 1 && (
              <IconButton icon="trash-2" label="Sil" showLabel tone="danger" onPress={confirmDeleteWorkspace} />
            )}
          </View>
        }
      />

      <PromptSheet
        visible={prompt !== null}
        title={prompt ? promptConfig[prompt.type].title : ""}
        initial={prompt ? promptConfig[prompt.type].initial : ""}
        onSubmit={onPromptSubmit}
        onClose={() => setPrompt(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.xl },
  wsButton: { flexDirection: "row", alignItems: "center", gap: space.sm, maxWidth: 240, minHeight: 44 },
  wsText: { flexShrink: 1, color: colors.ink, fontSize: 17, fontWeight: "700" },
  section: { gap: space.md },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md },
  sectionTitle: { flex: 1, color: colors.muted, fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  sectionActions: { flexDirection: "row", gap: space.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  card: { gap: space.sm },
  thumb: { width: "100%", aspectRatio: 4 / 3, borderRadius: radius.md, backgroundColor: colors.subtle },
  textThumb: { padding: space.md, borderWidth: 1, borderColor: colors.line },
  textThumbText: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  cardLabel: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  emptyGroup: { color: colors.muted, fontSize: 14 },
  empty: { alignItems: "center", gap: space.sm, paddingTop: 96 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: "700" },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: "center" },
  actions: { position: "absolute", right: space.lg, gap: space.md, alignItems: "flex-end" },
  sheetActions: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  pressed: { opacity: 0.65 },
});
