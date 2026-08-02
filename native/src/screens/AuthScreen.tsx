import React, { useEffect, useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Brand, Eyebrow, GoldButton } from "../components/Primitives";
import {
  acceptInvitation, MemberProfile, passwordLogin, requestMagicLink,
  requestPasswordReset
} from "../api/client";
import { colors } from "../theme";

type Props = {
  initialInvitation?: { code: string; email: string } | null;
  onAuthenticated: (profile: MemberProfile) => void;
};

type EntryMode = "signin" | "join";
type SignInMethod = "password" | "magic";

function message(error: unknown) {
  return error instanceof Error ? error.message : "Motion Only could not complete that request.";
}

export function AuthScreen({ initialInvitation, onAuthenticated }: Props) {
  const [entryMode, setEntryMode] = useState<EntryMode>(initialInvitation ? "join" : "signin");
  const [method, setMethod] = useState<SignInMethod>("password");
  const [invite, setInvite] = useState(initialInvitation?.code ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialInvitation?.email ?? "");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!initialInvitation) return;
    setEntryMode("join");
    setMethod("password");
    setInvite(initialInvitation.code);
    setEmail(initialInvitation.email);
    setSent(false);
  },[initialInvitation]);

  const validEmail = email.trim().includes("@");
  const canSubmit = validEmail && !busy && (
    entryMode === "join"
      ? invite.trim().length >= 8 && name.trim().length >= 2 && password.length >= 8
      : method === "magic" || password.length >= 8
  );

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const normalEmail = email.trim().toLowerCase();
      if (entryMode === "join") {
        const profile = await acceptInvitation({
          inviteCode:invite.trim(),
          email:normalEmail,
          password,
          name:name.trim()
        });
        onAuthenticated(profile);
        return;
      }
      if (method === "magic") {
        await requestMagicLink(normalEmail);
        setSent(true);
        return;
      }
      const profile = await passwordLogin(normalEmail,password);
      onAuthenticated(profile);
    } catch (error) {
      Alert.alert("Could not continue", message(error));
    } finally {
      setBusy(false);
    }
  };

  const forgotPassword = async () => {
    if (!validEmail) {
      Alert.alert("Enter your email", "Enter your member email first, then request a reset.");
      return;
    }
    setBusy(true);
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      Alert.alert("Check your email", "If an active account exists, a secure reset link is on its way.");
    } catch (error) {
      Alert.alert("Reset unavailable", message(error));
    } finally {
      setBusy(false);
    }
  };

  const changeEntryMode = (next:EntryMode) => {
    setEntryMode(next);
    setMethod("password");
    setSent(false);
    setPassword("");
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Brand />
        <View style={styles.hero}>
          <Eyebrow>PRIVATE MEMBERSHIP</Eyebrow>
          <Text style={styles.title}>MOMENTUM{`\n`}STARTS HERE.</Text>
          <Text style={styles.subtitle}>A private network for smart work, disciplined execution and consistent progress.</Text>
        </View>

        <View style={styles.authCard}>
          <View style={styles.entrySwitch}>
            <Pressable onPress={() => changeEntryMode("signin")} style={[styles.entryMode, entryMode === "signin" && styles.entryActive]}>
              <Text style={[styles.entryText, entryMode === "signin" && styles.entryTextActive]}>MEMBER SIGN IN</Text>
            </Pressable>
            <Pressable onPress={() => changeEntryMode("join")} style={[styles.entryMode, entryMode === "join" && styles.entryActive]}>
              <Text style={[styles.entryText, entryMode === "join" && styles.entryTextActive]}>USE INVITATION</Text>
            </Pressable>
          </View>

          {entryMode === "join" && (
            <>
              <View style={styles.lockRow}>
                <Ionicons name="lock-closed" size={15} color={colors.gold} />
                <Text style={styles.lockText}>SINGLE-USE INVITATION</Text>
              </View>
              <Text style={styles.label}>Invitation code</Text>
              <TextInput value={invite} onChangeText={setInvite} autoCapitalize="none" autoCorrect={false} placeholder="Paste your private code" placeholderTextColor={colors.mutedDark} style={styles.input} />
              <Text style={styles.label}>Your name</Text>
              <TextInput value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" placeholder="How members should know you" placeholderTextColor={colors.mutedDark} style={styles.input} />
            </>
          )}

          <Text style={styles.label}>Email address</Text>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@example.com" placeholderTextColor={colors.mutedDark} style={styles.input} />

          {entryMode === "signin" && (
            <View style={styles.modeSwitch}>
              <Pressable onPress={() => { setMethod("password"); setSent(false); }} style={[styles.mode, method === "password" && styles.modeActive]}>
                <Text style={[styles.modeText, method === "password" && styles.modeTextActive]}>PASSWORD</Text>
              </Pressable>
              <Pressable onPress={() => { setMethod("magic"); setSent(false); }} style={[styles.mode, method === "magic" && styles.modeActive]}>
                <Text style={[styles.modeText, method === "magic" && styles.modeTextActive]}>MAGIC LINK</Text>
              </Pressable>
            </View>
          )}

          {(entryMode === "join" || method === "password") ? (
            <>
              <View style={styles.passwordLabel}>
                <Text style={styles.label}>Password</Text>
                {entryMode === "signin" && <Pressable disabled={busy} onPress={forgotPassword}><Text style={styles.forgot}>FORGOT PASSWORD?</Text></Pressable>}
              </View>
              <TextInput value={password} onChangeText={setPassword} secureTextEntry autoComplete={entryMode === "join" ? "new-password" : "password"} placeholder="Minimum 8 characters" placeholderTextColor={colors.mutedDark} style={styles.input} />
            </>
          ) : (
            <View style={styles.magicInfo}>
              <Ionicons name="mail-outline" size={18} color={colors.gold} />
              <Text style={styles.magicText}>We will send a single-use sign-in link to your active member email.</Text>
            </View>
          )}

          {sent ? (
            <View style={styles.sent}>
              <Ionicons name="checkmark-circle" size={22} color={colors.green} />
              <View style={{ flex:1 }}>
                <Text style={styles.sentTitle}>CHECK YOUR EMAIL</Text>
                <Text style={styles.sentText}>If an active account exists, the secure link will arrive shortly and expire in 15 minutes.</Text>
              </View>
            </View>
          ) : (
            <GoldButton
              label={busy ? "Please wait" : entryMode === "join" ? "Create secure account" : method === "password" ? "Sign in" : "Send magic link"}
              onPress={submit}
              disabled={!canSubmit}
              icon={entryMode === "join" ? "arrow-forward" : method === "password" ? "log-in-outline" : "mail"}
            />
          )}
          <Text style={styles.privacy}>Membership, goals, financial records and progress are private by default.</Text>
        </View>
        <Text style={styles.footer}>MOTION ONLY · CONNECT · BUILD · ADVANCE</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:colors.black},
  content:{flexGrow:1,paddingHorizontal:24,paddingTop:62,paddingBottom:35},
  hero:{marginTop:46,marginBottom:25,borderLeftWidth:3,borderLeftColor:colors.gold,paddingLeft:18},
  title:{color:colors.text,fontSize:44,lineHeight:41,fontWeight:"900",fontStyle:"italic",letterSpacing:-.6},
  subtitle:{color:colors.muted,fontSize:12,lineHeight:19,marginTop:13,maxWidth:330},
  authCard:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line,padding:18,gap:9},
  entrySwitch:{flexDirection:"row",backgroundColor:colors.background,padding:3,marginBottom:8},
  entryMode:{flex:1,paddingVertical:10,alignItems:"center"},
  entryActive:{backgroundColor:colors.raised},
  entryText:{color:colors.muted,fontSize:8,fontWeight:"800",letterSpacing:.65},
  entryTextActive:{color:colors.gold},
  lockRow:{flexDirection:"row",alignItems:"center",gap:7,marginBottom:2},
  lockText:{color:colors.textSoft,fontSize:9,letterSpacing:1.2,fontWeight:"800"},
  label:{color:colors.muted,fontSize:9,letterSpacing:.8,textTransform:"uppercase",fontWeight:"700",marginTop:5},
  input:{minHeight:46,backgroundColor:colors.background,borderWidth:1,borderColor:colors.lineStrong,color:colors.text,paddingHorizontal:13,fontSize:13},
  modeSwitch:{flexDirection:"row",padding:3,backgroundColor:colors.background,marginVertical:7},
  mode:{flex:1,paddingVertical:9,alignItems:"center"},
  modeActive:{backgroundColor:colors.raised},
  modeText:{color:colors.muted,fontSize:9,fontWeight:"800",letterSpacing:.7},
  modeTextActive:{color:colors.gold},
  passwordLabel:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  forgot:{color:colors.gold,fontSize:7,fontWeight:"900",letterSpacing:.5,marginTop:5},
  magicInfo:{minHeight:60,flexDirection:"row",alignItems:"center",gap:11,borderWidth:1,borderColor:colors.line,padding:13,marginBottom:5},
  magicText:{color:colors.muted,fontSize:10,lineHeight:15,flex:1},
  sent:{minHeight:64,flexDirection:"row",alignItems:"center",gap:10,backgroundColor:"#111A14",borderWidth:1,borderColor:"#263D2D",padding:12},
  sentTitle:{color:colors.text,fontWeight:"800",fontSize:10,letterSpacing:.8},
  sentText:{color:colors.muted,fontSize:8,lineHeight:12,marginTop:3},
  privacy:{color:colors.mutedDark,fontSize:8,lineHeight:13,textAlign:"center",marginTop:5},
  footer:{color:"#3E4244",fontSize:8,letterSpacing:1.6,textAlign:"center",marginTop:"auto",paddingTop:35}
});
