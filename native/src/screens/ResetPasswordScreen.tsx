import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { Brand, Eyebrow, GoldButton, OutlineButton } from "../components/Primitives";
import { confirmPasswordReset } from "../api/client";
import { colors } from "../theme";

type Props = {
  token:string;
  onComplete:() => void;
  onCancel:() => void;
};

export function ResetPasswordScreen({ token, onComplete, onCancel }:Props) {
  const [password,setPassword] = useState("");
  const [confirm,setConfirm] = useState("");
  const [busy,setBusy] = useState(false);

  const submit = async () => {
    if (password.length < 8) {
      Alert.alert("Password too short","Use at least eight characters.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Passwords do not match","Enter the same new password twice.");
      return;
    }
    setBusy(true);
    try {
      await confirmPasswordReset(token,password);
      Alert.alert("Password changed","Sign in with your new password.",[{text:"Continue",onPress:onComplete}]);
    } catch (error) {
      Alert.alert("Link could not be used",error instanceof Error ? error.message : "Request a new password reset link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.content}>
        <Brand/>
        <View style={styles.hero}>
          <Eyebrow>ACCOUNT RECOVERY</Eyebrow>
          <Text style={styles.title}>SET A NEW{`\n`}PASSWORD.</Text>
          <Text style={styles.body}>This single-use link will be invalidated after your password changes. Existing sessions will be signed out.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>New password</Text>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" style={styles.input}/>
          <Text style={styles.label}>Confirm password</Text>
          <TextInput value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" style={styles.input}/>
          <GoldButton label={busy ? "Please wait" : "Save new password"} disabled={busy} onPress={submit} icon="shield-checkmark-outline"/>
          <OutlineButton label="Cancel" onPress={onCancel}/>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:colors.black},
  content:{flex:1,paddingHorizontal:24,paddingTop:62},
  hero:{borderLeftWidth:3,borderLeftColor:colors.gold,paddingLeft:18,marginTop:60,marginBottom:28},
  title:{color:colors.text,fontSize:42,lineHeight:40,fontWeight:"900",fontStyle:"italic"},
  body:{color:colors.muted,fontSize:11,lineHeight:18,marginTop:13},
  card:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line,padding:18,gap:10},
  label:{color:colors.muted,fontSize:9,fontWeight:"700",letterSpacing:.8,textTransform:"uppercase"},
  input:{minHeight:48,borderWidth:1,borderColor:colors.lineStrong,backgroundColor:colors.background,color:colors.text,paddingHorizontal:13}
});
