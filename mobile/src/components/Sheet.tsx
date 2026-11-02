import { Feather } from "@expo/vector-icons";
import { useEffect, useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, space } from "../theme";

type SheetProps = { visible: boolean; title: string; onClose: () => void; children: ReactNode };

// Alttan açılan, yerel his veren panel.
export function Sheet({ visible, title, onClose, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Kapat" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
          <View style={styles.grabber} />
          <Text style={styles.title}>{title}</Text>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type Option = { value: string; label: string };

type ChoiceProps = {
  visible: boolean;
  title: string;
  options: Option[];
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  footer?: ReactNode;
};

export function ChoiceSheet({ visible, title, options, value, onSelect, onClose, footer }: ChoiceProps) {
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      <View style={styles.list}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => {
                onSelect(o.value);
                onClose();
              }}
              style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]} numberOfLines={1}>
                {o.label}
              </Text>
              {selected && <Feather name="check" size={20} color={colors.accent} />}
            </Pressable>
          );
        })}
      </View>
      {footer}
    </Sheet>
  );
}

type PromptProps = {
  visible: boolean;
  title: string;
  initial?: string;
  confirmLabel?: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
};

export function PromptSheet({ visible, title, initial = "", confirmLabel = "Kaydet", onSubmit, onClose }: PromptProps) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    if (visible) setValue(initial);
  }, [visible, initial]);

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    onSubmit(text);
    onClose();
  };

  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      <TextInput
        autoFocus
        value={value}
        onChangeText={setValue}
        onSubmitEditing={submit}
        returnKeyType="done"
        placeholder="Ad"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      <Pressable
        accessibilityRole="button"
        onPress={submit}
        disabled={!value.trim()}
        style={({ pressed }) => [styles.primary, !value.trim() && styles.disabled, pressed && styles.pressed]}
      >
        <Text style={styles.primaryText}>{confirmLabel}</Text>
      </Pressable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.surface,
  },
  grabber: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: colors.line },
  title: { paddingTop: space.xs, color: colors.ink, fontSize: 17, fontWeight: "700" },
  list: { gap: space.sm },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.subtle,
  },
  optionSelected: { backgroundColor: colors.accentSoft },
  optionText: { flexShrink: 1, color: colors.ink, fontSize: 16 },
  optionTextSelected: { color: colors.accent, fontWeight: "600" },
  input: {
    minHeight: 52,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 16,
  },
  primary: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.ink,
  },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
});
