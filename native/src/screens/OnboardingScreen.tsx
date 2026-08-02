import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Brand, Eyebrow, GoldButton, OutlineButton } from "../components/Primitives";
import { Focus } from "../data";
import { colors } from "../theme";

type Props = {
  email: string;
  initialName?: string;
  initialFocuses?: Focus[];
  onComplete: (profile: { name: string; focuses: Focus[] }) => void;
};

const focusOptions: { name: Focus; icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { name: "Business", icon: "briefcase-outline", text: "Offers, pipeline, operations and growth." },
  { name: "Trading", icon: "trending-up", text: "Process, execution, risk and review." },
  { name: "Fitness", icon: "barbell-outline", text: "Strength, conditioning and recovery." }
];

export function OnboardingScreen({ email, initialName = "", initialFocuses = ["Business","Trading","Fitness"], onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);
  const [focuses, setFocuses] = useState<Focus[]>(initialFocuses);

  const toggleFocus = (focus: Focus) => {
    setFocuses(current => current.includes(focus) ? current.filter(item => item !== focus) : [...current, focus]);
  };

  return (
    <View style={styles.root}>
      <View style={styles.top}><Brand compact /><Text style={styles.step}>0{step + 1} / 03</Text></View>
      <View style={styles.progress}><View style={[styles.progressFill, { width: `${((step + 1) / 3) * 100}%` }]} /></View>
      <ScrollView contentContainerStyle={styles.content}>
        {step === 0 && (
          <>
            <Eyebrow>YOUR IDENTITY</Eyebrow>
            <Text style={styles.title}>WELCOME TO{`\n`}MOTION ONLY.</Text>
            <Text style={styles.body}>Set up the profile other verified members will see. You remain in control of every detail.</Text>
            <Text style={styles.label}>What should we call you?</Text>
            <TextInput value={name} onChangeText={setName} autoFocus placeholder="Your name" placeholderTextColor={colors.mutedDark} style={styles.input} />
            <View style={styles.emailRow}><Ionicons name="checkmark-circle" color={colors.green} size={16}/><Text style={styles.email}>{email} verified</Text></View>
          </>
        )}
        {step === 1 && (
          <>
            <Eyebrow>YOUR DIRECTION</Eyebrow>
            <Text style={styles.title}>WHERE ARE YOU{`\n`}BUILDING MOMENTUM?</Text>
            <Text style={styles.body}>Choose one or more. This shapes your rooms, projects and dashboard—not what you are allowed to access.</Text>
            <View style={styles.focusList}>
              {focusOptions.map(option => {
                const active = focuses.includes(option.name);
                return <Pressable key={option.name} onPress={() => toggleFocus(option.name)} style={[styles.focusCard, active && styles.focusActive]}>
                  <View style={[styles.focusIcon, active && styles.focusIconActive]}><Ionicons name={option.icon} color={active ? colors.black : colors.gold} size={21}/></View>
                  <View style={{ flex: 1 }}><Text style={styles.focusTitle}>{option.name}</Text><Text style={styles.focusText}>{option.text}</Text></View>
                  <Ionicons name={active ? "checkbox" : "square-outline"} color={active ? colors.gold : colors.mutedDark} size={21}/>
                </Pressable>;
              })}
            </View>
          </>
        )}
        {step === 2 && (
          <>
            <Eyebrow>YOUR CONTROL</Eyebrow>
            <Text style={styles.title}>PRIVATE FROM{`\n`}THE FIRST MOVE.</Text>
            <Text style={styles.body}>Motion Only starts closed. You decide what moves beyond your private space.</Text>
            {[
              ["Goals and progress", "Only visible to you until shared", "lock-closed-outline"],
              ["Trading journals", "Never visible to rooms by default", "shield-checkmark-outline"],
              ["Messages and files", "Restricted to explicit participants", "chatbubble-ellipses-outline"],
              ["Member discovery", "Visible only inside Motion Only", "people-outline"]
            ].map(([title, text, icon]) => <View style={styles.privacyRow} key={title}>
              <Ionicons name={icon as keyof typeof Ionicons.glyphMap} color={colors.gold} size={20}/>
              <View><Text style={styles.privacyTitle}>{title}</Text><Text style={styles.privacyText}>{text}</Text></View>
              <Ionicons name="checkmark" color={colors.green} size={17}/>
            </View>)}
          </>
        )}
      </ScrollView>
      <View style={styles.actions}>
        {step > 0 && <OutlineButton label="Back" icon="arrow-back" onPress={() => setStep(step - 1)} />}
        <View style={{ flex: 1 }}><GoldButton label={step === 2 ? "Enter Motion Only" : "Continue"} disabled={(step === 0 && !name.trim()) || (step === 1 && !focuses.length)} onPress={() => step === 2 ? onComplete({ name: name.trim(), focuses }) : setStep(step + 1)} /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  top: { paddingTop: 58, paddingHorizontal: 22, paddingBottom: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  step: { color: colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  progress: { height: 2, backgroundColor: colors.line },
  progressFill: { height: 2, backgroundColor: colors.gold },
  content: { paddingHorizontal: 24, paddingTop: 50, paddingBottom: 30 },
  title: { color: colors.text, fontSize: 39, lineHeight: 38, fontWeight: "900", fontStyle: "italic", letterSpacing: -.5 },
  body: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 15, marginBottom: 35 },
  label: { color: colors.muted, fontSize: 9, fontWeight: "700", letterSpacing: .9, textTransform: "uppercase", marginBottom: 8 },
  input: { minHeight: 52, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineStrong, color: colors.text, paddingHorizontal: 15, fontSize: 15 },
  emailRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 13 },
  email: { color: colors.muted, fontSize: 10 },
  focusList: { gap: 11 },
  focusCard: { minHeight: 86, flexDirection: "row", alignItems: "center", gap: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 14 },
  focusActive: { borderColor: "#5C4C29", backgroundColor: "#171612" },
  focusIcon: { width: 43, height: 43, backgroundColor: colors.goldSoft, alignItems: "center", justifyContent: "center" },
  focusIconActive: { backgroundColor: colors.gold },
  focusTitle: { color: colors.text, fontWeight: "800", fontSize: 13 },
  focusText: { color: colors.muted, fontSize: 9, marginTop: 4, lineHeight: 13 },
  privacyRow: { flexDirection: "row", alignItems: "center", gap: 13, borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 16 },
  privacyTitle: { color: colors.textSoft, fontSize: 11, fontWeight: "700" },
  privacyText: { color: colors.muted, fontSize: 9, marginTop: 3 },
  actions: { paddingHorizontal: 22, paddingBottom: 35, paddingTop: 13, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: "row", gap: 10 }
});
