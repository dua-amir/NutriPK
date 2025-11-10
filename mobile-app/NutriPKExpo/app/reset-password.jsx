import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import { BACKEND_BASE } from "./config";

export default function ResetPassword() {
  const router = useRouter();
  // try expo-router search params first, then fallback to window.location (web)
  const params = useLocalSearchParams();
  let token = params?.token;
  if (!token && typeof window !== "undefined") {
    const qp = new URLSearchParams(window.location.search);
    token = qp.get("token");
  }
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setError("");
    setSuccess("");
    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    // Strong password check
    const strongRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongRegex.test(newPassword)) {
      setError(
        "Password must be at least 8 characters, include a number, a symbol, a lowercase and an uppercase letter."
      );
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_BASE}/api/user/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || "Failed to reset password.");
      } else {
        setSuccess("Password reset successful! Redirecting to login...");
        // short delay so user sees success message, then go to Login
        setTimeout(() => {
          router.replace("/Login");
        }, 900);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF3EC" }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.outerFrame}>
          <View style={styles.innerFrame}>
            <View style={styles.cardTop}>
              <TouchableOpacity
                style={styles.backIcon}
                onPress={() => router.replace("/Login")}
              >
                <Ionicons name="arrow-back" size={20} color="#0e4f11ff" />
              </TouchableOpacity>
              <Text style={styles.heading}>Secure Your Account!</Text>
              <Text style={styles.subtitle}>
                Your account security is our top priority. Please create a new
                password using a mix of letters, numbers, and symbols.
              </Text>
            </View>

            <View style={styles.card}>
              {success ? (
                <Text style={styles.successText}>{success}</Text>
              ) : (
                <>
                  <View style={styles.inputBox}>
                    <Ionicons
                      name="lock-closed"
                      size={20}
                      color="#7B8794"
                      style={{ marginRight: 10 }}
                    />
                    <TextInput
                      style={styles.inputBoxInput}
                      placeholder="Create new password"
                      placeholderTextColor="#A0A0A0"
                      secureTextEntry={!showNew}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      selectionColor="#0e4f11ff"
                    />
                    <TouchableOpacity
                      onPress={() => setShowNew((s) => !s)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showNew ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#4E944F"
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputBox}>
                    <Ionicons
                      name="lock-closed"
                      size={20}
                      color="#7B8794"
                      style={{ marginRight: 10 }}
                    />
                    <TextInput
                      style={styles.inputBoxInput}
                      placeholder="Confirm new password"
                      placeholderTextColor="#A0A0A0"
                      secureTextEntry={!showConfirm}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      selectionColor="#0e4f11ff"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirm((s) => !s)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showConfirm ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#4E944F"
                      />
                    </TouchableOpacity>
                  </View>

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer save button pinned to bottom of screen (outside the white card) */}
      {!success && (
        <View style={styles.footer} pointerEvents={loading ? "none" : "auto"}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleReset}
            disabled={loading}
            activeOpacity={0.9}
          >
            <Text style={styles.saveButtonText}>
              {loading ? "Saving..." : "Save New Password"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#FFF3EC",
    marginTop: Platform.OS === "android" ? 30 : 0,
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 160, // room for bottom pill button
  },
  outerFrame: {
    width: "100%",
    alignItems: "center",
    // keep transparent so there's no green border
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  innerFrame: {
    width: "100%",
    // white card look with subtle shadow
    backgroundColor: "#FFF3EC",
    borderRadius: 12,
    padding: 18,
    // small card shadow
    shadowColor: "#0e4f11ff",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    width: "100%",
    marginBottom: 12,
    paddingHorizontal: 6,
    position: "relative",
  },
  // place the back icon in normal flow so it sits above the heading instead of overlapping
  backIcon: {
    position: "relative",
    alignSelf: "flex-start",
    marginBottom: 8,
    padding: 6,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0e4f11ff",
    marginBottom: 8,
    marginTop: 2,
  },
  subtitle: {
    color: "#7B8794",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  card: {
    width: "100%",
    backgroundColor: "transparent",
    padding: 0,
  },
  inputBox: {
    width: "100%",
    height: 56,
    backgroundColor: "#F6F8F7",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 0,
  },
  inputBoxInput: {
    flex: 1,
    fontSize: 16,
    color: "#222",
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 8,
  },
  errorText: {
    color: "red",
    marginTop: 6,
    marginBottom: 6,
    fontSize: 14,
    textAlign: "center",
  },
  successText: {
    color: "#2E7D32",
    fontSize: 15,
    marginBottom: 12,
    textAlign: "center",
  },
  saveWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    alignItems: "center",
  },
  saveButton: {
    width: 260,
    maxWidth: 420,
    height: 52,
    backgroundColor: "#0e4f11ff",
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
