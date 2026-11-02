import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { randomUUID } from "expo-crypto";
import IconButton from "../../components/IconButton";
import { ChoiceSheet } from "../../components/Sheet";
import type { PhotoPage, Pin, TextPage } from "../../lib/notes";
import { photoUri, useNotes } from "../../lib/store";
import { colors, radius, space } from "../../theme";

const PIN = 32;

export default function PageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const notes = useNotes();
  const page = notes.store.pages.find((p) => p.id === id);
  const [groupOpen, setGroupOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sayfa silinince albüme dön.
  useEffect(() => {
    if (!page && !deleting) router.back();
  }, [page, deleting]);

  if (!page) return null;

  function confirmDelete() {
    Alert.alert("Bu sayfa silinsin mi?", "Sayfa ve içindeki notlar silinir.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          setDeleting(true);
          router.back();
          notes.deletePage(page!.id);
        },
      },
    ]);
  }

  const groupOptions = [{ value: "", label: "Grupsuz" }, ...notes.groups.map((g) => ({ value: g.id, label: g.name }))];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.root}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              {page.kind === "photo" && (
                <IconButton
                  icon={notes.store.showPreviews ? "eye" : "eye-off"}
                  label={notes.store.showPreviews ? "Not önizlemelerini gizle" : "Not önizlemelerini göster"}
                  size={40}
                  active={notes.store.showPreviews}
                  onPress={() => notes.setShowPreviews(!notes.store.showPreviews)}
                />
              )}
              <IconButton icon="folder" label="Grup seç" size={40} onPress={() => setGroupOpen(true)} />
              <IconButton icon="trash-2" label="Sayfayı sil" size={40} tone="danger" onPress={confirmDelete} />
            </View>
          ),
        }}
      />

      <TextInput
        value={page.title}
        onChangeText={(title) => notes.updatePage({ ...page, title })}
        placeholder="Başlık ekle..."
        placeholderTextColor={colors.muted}
        accessibilityLabel="Sayfa başlığı"
        style={styles.title}
      />

      {page.kind === "photo" ? <PhotoEditor page={page} /> : <TextEditor page={page} />}

      <ChoiceSheet
        visible={groupOpen}
        title="Grup"
        options={groupOptions}
        value={page.groupId ?? ""}
        onSelect={(v) => notes.updatePage({ ...page, groupId: v || null })}
        onClose={() => setGroupOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

function TextEditor({ page }: { page: TextPage }) {
  const { updatePage } = useNotes();
  return (
    <TextInput
      multiline
      value={page.text}
      onChangeText={(text) => updatePage({ ...page, text })}
      placeholder="Notunu buraya yaz..."
      placeholderTextColor={colors.muted}
      accessibilityLabel="Not metni"
      textAlignVertical="top"
      style={styles.textBody}
    />
  );
}

function PhotoEditor({ page }: { page: PhotoPage }) {
  const { updatePage, store } = useNotes();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const active = page.pins.find((p) => p.id === activeId);

  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  function addPin(x: number, y: number) {
    if (!size.w || !size.h) return;
    const pin: Pin = {
      id: randomUUID(),
      x: Math.min(100, Math.max(0, (x / size.w) * 100)),
      y: Math.min(100, Math.max(0, (y / size.h) * 100)),
      text: "",
    };
    updatePage({ ...page, pins: [...page.pins, pin] });
    setActiveId(pin.id);
  }

  const updatePin = (pinId: string, text: string) =>
    updatePage({ ...page, pins: page.pins.map((p) => (p.id === pinId ? { ...p, text } : p)) });

  function removePin(pinId: string) {
    updatePage({ ...page, pins: page.pins.filter((p) => p.id !== pinId) });
    setActiveId(null);
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.photoContent}>
      <Text style={styles.hint}>{page.pins.length === 0 ? "Not eklemek için fotoğrafa dokun" : `${page.pins.length} not`}</Text>

      <Pressable
        onLayout={onLayout}
        onPress={(e) => addPin(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        accessibilityLabel="Fotoğraf: not eklemek için dokun"
        style={[styles.photo, { aspectRatio: page.ratio }]}
      >
        <Image
          source={{ uri: photoUri(page.file) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          pointerEvents="none"
        />

        {store.showPreviews &&
          size.w > 0 &&
          page.pins.map((pin) =>
            pin.text.trim() ? (
              <Pressable
                key={`preview-${pin.id}`}
                onPress={() => setActiveId(pin.id)}
                style={[
                  styles.preview,
                  { top: (pin.y / 100) * size.h - 14 },
                  pin.x > 55
                    ? { right: size.w - (pin.x / 100) * size.w + PIN / 2 + 8 }
                    : { left: (pin.x / 100) * size.w + PIN / 2 + 8 },
                ]}
              >
                <Text numberOfLines={2} style={styles.previewText}>
                  {pin.text}
                </Text>
              </Pressable>
            ) : null,
          )}

        {size.w > 0 &&
          page.pins.map((pin, i) => (
            <Pressable
              key={pin.id}
              accessibilityLabel={`Not ${i + 1}`}
              hitSlop={8}
              onPress={() => setActiveId(pin.id)}
              style={[
                styles.pin,
                pin.id === activeId && styles.pinActive,
                { left: (pin.x / 100) * size.w - PIN / 2, top: (pin.y / 100) * size.h - PIN / 2 },
              ]}
            >
              <Text style={styles.pinText}>{i + 1}</Text>
            </Pressable>
          ))}
      </Pressable>

      {active ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Not {page.pins.indexOf(active) + 1}</Text>
          <TextInput
            autoFocus
            multiline
            value={active.text}
            onChangeText={(t) => updatePin(active.id, t)}
            placeholder="Bu nokta hakkında..."
            placeholderTextColor={colors.muted}
            accessibilityLabel="Not metni"
            textAlignVertical="top"
            style={styles.pinInput}
          />
          <View style={styles.panelActions}>
            <IconButton icon="check" label="Tamam" showLabel tone="primary" style={styles.flex} onPress={() => setActiveId(null)} />
            <IconButton icon="trash-2" label="Sil" tone="danger" onPress={() => removePin(active.id)} />
          </View>
        </View>
      ) : (
        page.pins.length > 0 && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Notlar</Text>
            {page.pins.map((p, i) => (
              <Pressable
                key={p.id}
                onPress={() => setActiveId(p.id)}
                style={({ pressed }) => [styles.noteRow, pressed && styles.pressed]}
              >
                <Text style={styles.noteIndex}>{i + 1}</Text>
                <Text numberOfLines={2} style={[styles.noteText, !p.text && styles.noteEmpty]}>
                  {p.text || "boş not"}
                </Text>
              </Pressable>
            ))}
          </View>
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerActions: { flexDirection: "row", gap: space.sm },
  title: {
    marginHorizontal: space.lg,
    marginBottom: space.md,
    minHeight: 48,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 17,
    fontWeight: "600",
  },
  textBody: {
    flex: 1,
    margin: space.lg,
    marginTop: space.sm,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 17,
    lineHeight: 24,
  },
  photoContent: { padding: space.lg, paddingTop: 0, gap: space.lg },
  hint: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  photo: { width: "100%", overflow: "hidden", borderRadius: radius.md, backgroundColor: colors.subtle },
  pin: {
    position: "absolute",
    width: PIN,
    height: PIN,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: PIN / 2,
    backgroundColor: colors.accent,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pinActive: { backgroundColor: colors.ink, transform: [{ scale: 1.15 }] },
  pinText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  preview: {
    position: "absolute",
    maxWidth: 150,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  previewText: { color: colors.ink, fontSize: 12, lineHeight: 16 },
  panel: {
    gap: space.md,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  panelTitle: { color: colors.muted, fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  pinInput: {
    minHeight: 110,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    color: colors.ink,
    fontSize: 16,
    lineHeight: 22,
  },
  panelActions: { flexDirection: "row", gap: space.md },
  flex: { flex: 1 },
  noteRow: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 44 },
  noteIndex: { width: 24, color: colors.accent, fontSize: 15, fontWeight: "700", textAlign: "center" },
  noteText: { flex: 1, color: colors.ink, fontSize: 15 },
  noteEmpty: { color: colors.muted },
  pressed: { opacity: 0.65 },
});
