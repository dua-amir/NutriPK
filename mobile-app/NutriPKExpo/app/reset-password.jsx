import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function ResetPassword() {
  const router = useRouter();
  const { token } = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongRegex.test(newPassword)) {
      setError("Password must be at least 8 characters, include a number, a symbol, a lowercase and an uppercase letter.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/user/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || "Failed to reset password.");
      } else {
        setSuccess("Password reset successful! You can now login.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Reset Password</Text>
        {success ? (
          <Text style={styles.successText}>{success}</Text>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? "Resetting..." : "Reset Password"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/Login")}> 
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0E0D5",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 18,
    alignSelf: "flex-start",
    letterSpacing: 0.5,
  },
  input: {
    width: "100%",
    height: 44,
    backgroundColor: "#E0E0D5",
    borderRadius: 8,
    borderWidth: 0,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    color: "#2E7D32",
  },
  button: {
    width: "100%",
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 0.2,
  },
  backButton: {
    marginTop: 4,
    alignItems: "center",
  },
  backButtonText: {
    color: "#4E944F",
    fontSize: 15,
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  errorText: {
    color: "red",
    fontSize: 15,
    marginBottom: 8,
    textAlign: "center",
  },
  successText: {
    color: "#2E7D32",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 18,
    fontWeight: "bold",
  },
});
