import React, { PropsWithChildren } from "react";
import { Image, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.brand}>
      <View style={[styles.mark, compact && styles.markCompact]}>
        <Image source={require("../../assets/motion-only-logo-dark.png")} style={styles.markImage} resizeMode="contain" />
      </View>
      {!compact && (
        <View>
          <Text style={styles.brandName}>MOTION <Text style={styles.brandGold}>ONLY</Text></Text>
          <Text style={styles.brandLine}>CONNECT · BUILD · ADVANCE</Text>
        </View>
      )}
    </View>
  );
}

export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle | ViewStyle[] }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function GoldButton({ label, icon = "arrow-forward", onPress, disabled }: { label: string; icon?: keyof typeof Ionicons.glyphMap; onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.goldButton, pressed && styles.pressed, disabled && styles.disabled]}>
      <Text style={styles.goldButtonText}>{label}</Text>
      <Ionicons name={icon} color={colors.black} size={17} />
    </Pressable>
  );
}

export function OutlineButton({ label, onPress, icon }: { label: string; onPress?: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}>
      {icon && <Ionicons name={icon} color={colors.textSoft} size={16} />}
      <Text style={styles.outlineButtonText}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(value, 100))}%` }]} /></View>;
}

const styles = StyleSheet.create({
  brand: { flexDirection: "row", alignItems: "center", gap: 13 },
  mark: { width: 43, height: 43, overflow: "hidden" },
  markCompact: { width: 34, height: 34 },
  markImage: { width: "100%", height: "100%" },
  brandName: { color: colors.text, fontWeight: "900", fontStyle: "italic", fontSize: 18, letterSpacing: .8 },
  brandGold: { color: colors.gold },
  brandLine: { color: colors.muted, fontSize: 7, letterSpacing: 1.2, marginTop: 3 },
  eyebrow: { color: colors.gold, fontSize: 9, letterSpacing: 1.7, fontWeight: "800", textTransform: "uppercase", marginBottom: 8 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 16 },
  goldButton: { minHeight: 48, paddingHorizontal: 17, backgroundColor: colors.gold, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  goldButtonText: { color: colors.black, fontSize: 12, fontWeight: "900", letterSpacing: .8, textTransform: "uppercase" },
  outlineButton: { minHeight: 45, borderWidth: 1, borderColor: colors.lineStrong, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  outlineButtonText: { color: colors.textSoft, fontSize: 11, fontWeight: "700", letterSpacing: .5, textTransform: "uppercase" },
  progressTrack: { height: 3, backgroundColor: colors.line, overflow: "hidden" },
  progressFill: { height: 3, backgroundColor: colors.gold },
  pressed: { opacity: .76 },
  disabled: { opacity: .35 }
});
