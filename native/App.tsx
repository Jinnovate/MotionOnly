import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthScreen } from "./src/screens/AuthScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { MainApp } from "./src/screens/MainApp";
import { ResetPasswordScreen } from "./src/screens/ResetPasswordScreen";
import { Focus } from "./src/data";
import {
  clearLocalSession, getMe, hasLocalSession, logout as apiLogout, MemberProfile,
  updateMe, verifyMagicLink
} from "./src/api/client";
import { colors } from "./src/theme";

type Stage = "auth" | "onboarding" | "app" | "reset";
type PendingInvitation = { code: string; email: string };

function focuses(profile:MemberProfile):Focus[] {
  return profile.focuses?.length ? profile.focuses : ["Business","Trading","Fitness"];
}

function displayName(profile:MemberProfile) {
  return profile.display_name || profile.displayName || profile.email.split("@")[0] || "Member";
}

export default function App() {
  const [ready,setReady] = useState(false);
  const [stage,setStage] = useState<Stage>("auth");
  const [profile,setProfile] = useState<MemberProfile | null>(null);
  const [resetToken,setResetToken] = useState("");
  const [pendingInvitation,setPendingInvitation] = useState<PendingInvitation | null>(null);

  const enterFromProfile = useCallback((member:MemberProfile) => {
    setProfile(member);
    const completed = Boolean(member.onboarding_completed_at ?? member.onboardingCompleted);
    setStage(completed ? "app" : "onboarding");
  },[]);

  const handleUrl = useCallback(async (url:string | null) => {
    if (!url) return;
    let parsed:URL;
    try {
      parsed=new URL(url);
    } catch {
      return;
    }
    if (parsed.pathname === "/join") {
      const code = parsed.searchParams.get("code");
      const email = parsed.searchParams.get("email");
      if (code && email) {
        setPendingInvitation({code,email});
        setStage("auth");
      }
      return;
    }
    const token = parsed.searchParams.get("token");
    if (!token) return;
    if (parsed.pathname === "/reset-password") {
      setResetToken(token);
      setStage("reset");
      return;
    }
    if (parsed.pathname !== "/magic") return;
    try {
      const member = await verifyMagicLink(token);
      enterFromProfile(member);
    } catch (error) {
      Alert.alert("Sign-in link could not be used",error instanceof Error ? error.message : "Request a new link and try again.");
    }
  },[enterFromProfile]);

  useEffect(() => {
    const restore = async () => {
      try {
        if (await hasLocalSession()) {
          enterFromProfile(await getMe());
        }
      } catch {
        await clearLocalSession();
        setStage("auth");
      } finally {
        setReady(true);
      }
    };
    restore();
    Linking.getInitialURL().then(handleUrl);
    const listener = Linking.addEventListener("url",event => handleUrl(event.url));
    return () => listener.remove();
  },[enterFromProfile,handleUrl]);

  const finishOnboarding = async (data:{name:string;focuses:Focus[]}) => {
    if (!profile) return;
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const updated = await updateMe({
        displayName:data.name,
        focuses:data.focuses,
        timezone,
        onboardingCompleted:true,
        progressVisibility:"private"
      });
      setProfile({...profile,...updated});
      setStage("app");
    } catch (error) {
      Alert.alert("Profile could not be saved",error instanceof Error ? error.message : "Check your connection and try again.");
    }
  };

  const logout = async () => {
    await apiLogout();
    setProfile(null);
    setStage("auth");
  };

  if (!ready) {
    return <View style={styles.loading}><ActivityIndicator color={colors.gold}/><StatusBar style="light"/></View>;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light"/>
      {stage === "auth" && (
        <AuthScreen
          initialInvitation={pendingInvitation}
          onAuthenticated={member => {
            setPendingInvitation(null);
            enterFromProfile(member);
          }}
        />
      )}
      {stage === "reset" && <ResetPasswordScreen token={resetToken} onCancel={() => setStage("auth")} onComplete={() => setStage("auth")}/>}
      {stage === "onboarding" && profile && (
        <OnboardingScreen
          email={profile.email}
          initialName={displayName(profile)}
          initialFocuses={focuses(profile)}
          onComplete={finishOnboarding}
        />
      )}
      {stage === "app" && profile && (
        <MainApp userId={profile.id} role={profile.role} name={displayName(profile)} focuses={focuses(profile)} onLogout={logout}/>
      )}
    </SafeAreaProvider>
  );
}

const styles=StyleSheet.create({
  loading:{flex:1,backgroundColor:colors.black,alignItems:"center",justifyContent:"center"}
});
