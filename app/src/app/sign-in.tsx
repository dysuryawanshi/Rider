import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Avatar, Button, Card, Chip, HelperText, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { hapticError, hapticSuccess } from "@/lib/feedback";
import { palette } from "@/lib/theme";

const DEMO_ACCOUNTS = [
  { label: "Maya · 3 new orders", email: "maya@rider.test" },
  { label: "Ravi · active delivery", email: "ravi@rider.test" },
];

type Phase =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "success"; name: string };

export default function SignInScreen() {
  const { signIn, completeSignIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const isEmpty = email.trim() === "" && password === "";
  const canSubmit = email.trim() !== "" && password !== "" && phase.kind !== "submitting" && phase.kind !== "success";

  async function submit() {
    if (!canSubmit) return;
    setPhase({ kind: "submitting" });
    try {
      const session = await signIn(email.trim(), password);
      hapticSuccess();
      setPhase({ kind: "success", name: session.user.name.split(" ")[0] });
      // Hold the success state briefly so the rider sees it, then enter the app.
      timer.current = setTimeout(() => completeSignIn(session), 900);
    } catch (err) {
      hapticError();
      const message =
        err instanceof ApiError ? err.message : "Something went wrong while signing in. Please try again.";
      setPhase({ kind: "error", message });
    }
  }

  const busy = phase.kind === "submitting" || phase.kind === "success";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Image source={require("../../assets/icon.png")} style={styles.logo} contentFit="cover" accessibilityLabel="Rider logo" />
            <Text variant="headlineMedium" style={styles.heroTitle}>
              Rider
            </Text>
            <Text variant="bodyMedium" style={styles.heroBody}>
              Accept orders, pick them up, and deliver — all from your phone.
            </Text>
          </View>

          {phase.kind === "success" ? (
            <Card mode="contained" style={styles.successCard} accessibilityLiveRegion="polite">
              <Card.Content style={styles.successContent}>
                <Avatar.Icon size={64} icon="check-bold" color="#FFFFFF" style={{ backgroundColor: palette.success }} />
                <Text variant="titleLarge" style={styles.successTitle}>
                  Welcome back, {phase.name}
                </Text>
                <Text variant="bodyMedium" style={styles.muted}>
                  Signed in. Loading your orders…
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <Card mode="elevated" style={styles.card}>
              <Card.Content style={styles.form}>
                <Text variant="titleLarge" style={styles.formTitle}>
                  Sign in
                </Text>

                {phase.kind === "error" ? (
                  <View style={styles.errorBox} accessibilityLiveRegion="assertive">
                    <Avatar.Icon size={32} icon="alert-circle" color="#FFFFFF" style={{ backgroundColor: palette.red }} />
                    <Text variant="bodyMedium" style={styles.errorText}>
                      {phase.message}
                    </Text>
                  </View>
                ) : null}

                <TextInput
                  mode="outlined"
                  label="Email"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (phase.kind === "error") setPhase({ kind: "idle" });
                  }}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="username"
                  left={<TextInput.Icon icon="email-outline" />}
                  disabled={busy}
                  returnKeyType="next"
                />
                <TextInput
                  mode="outlined"
                  label="Password"
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (phase.kind === "error") setPhase({ kind: "idle" });
                  }}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  textContentType="password"
                  left={<TextInput.Icon icon="lock-outline" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={() => setShowPassword((s) => !s)}
                      accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                    />
                  }
                  disabled={busy}
                  onSubmitEditing={submit}
                  returnKeyType="go"
                />
                <HelperText type="info" visible={isEmpty}>
                  Enter the email and password your dispatcher gave you.
                </HelperText>

                <Button
                  mode="contained"
                  onPress={submit}
                  loading={phase.kind === "submitting"}
                  disabled={!canSubmit}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  {phase.kind === "submitting" ? "Signing in…" : "Sign in"}
                </Button>
              </Card.Content>
            </Card>
          )}

          <View style={styles.demo}>
            <Text variant="labelLarge" style={styles.muted}>
              Demo accounts (password rider123)
            </Text>
            <View style={styles.chips}>
              {DEMO_ACCOUNTS.map((a) => (
                <Chip
                  key={a.email}
                  icon="account"
                  disabled={busy}
                  onPress={() => {
                    setEmail(a.email);
                    setPassword("rider123");
                    setPhase({ kind: "idle" });
                  }}
                >
                  {a.label}
                </Chip>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  scroll: { flexGrow: 1, padding: 20, gap: 20, justifyContent: "center", maxWidth: 480, width: "100%", alignSelf: "center" },
  hero: { alignItems: "center", gap: 6 },
  logo: { width: 88, height: 88, borderRadius: 22 },
  heroTitle: { color: palette.charcoal, fontWeight: "800", marginTop: 8 },
  heroBody: { color: palette.textMuted, textAlign: "center" },
  card: { backgroundColor: palette.surface },
  form: { gap: 12 },
  formTitle: { color: palette.charcoal, fontWeight: "700" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: palette.redTint,
  },
  errorText: { flex: 1, color: palette.redDark },
  buttonContent: { paddingVertical: 6 },
  buttonLabel: { fontSize: 16, fontWeight: "700" },
  successCard: { backgroundColor: palette.successTint },
  successContent: { alignItems: "center", gap: 8, paddingVertical: 24 },
  successTitle: { color: palette.charcoal, fontWeight: "700" },
  muted: { color: palette.textMuted },
  demo: { gap: 8, alignItems: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
});
