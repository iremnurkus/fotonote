import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius } from "../theme";

type Props = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  tone?: "default" | "primary" | "danger";
  active?: boolean;
  size?: number;
  showLabel?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Tek başına duran, ikon odaklı dokunma hedefi (en az 44pt).
export default function IconButton({ icon, label, onPress, tone = "default", active, size = 48, showLabel, style }: Props) {
  const color = tone === "primary" ? "#fff" : tone === "danger" ? colors.danger : active ? colors.accent : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { minWidth: size, height: size },
        showLabel && styles.withLabel,
        tone === "primary" && styles.primary,
        tone === "danger" && styles.danger,
        active && styles.active,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Feather name={icon} size={20} color={color} />
      {showLabel && <Text style={[styles.label, { color }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  withLabel: { flexDirection: "row", gap: 8, paddingHorizontal: 16 },
  primary: { backgroundColor: colors.ink, borderColor: colors.ink },
  danger: { backgroundColor: colors.dangerSoft, borderColor: "#fecaca" },
  active: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  pressed: { opacity: 0.65 },
  label: { fontSize: 15, fontWeight: "600" },
});
