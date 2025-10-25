import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/logo.jpg")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>NutriPK</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Forgot Password</Text>
        {submitted ? (
          <Text style={styles.successText}>
            If an account with that email exists, a password reset link has been
            sent.
          </Text>
        ) : (
          <>
            <Text style={styles.infoText}>
              Enter your email address and we'll send you a link to reset your
              password.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity
              style={styles.resetButton}
              activeOpacity={0.85}
              onPress={() => setSubmitted(true)}
            >
              <Text style={styles.resetButtonText}>Send Reset Link</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
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
  logoContainer: {
    alignItems: "center",
    marginBottom: 18,
  },
  logo: {
    width: 110,
    height: 110,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E0D5",
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#0e4f11ff",
    letterSpacing: 1,
    marginBottom: 2,
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
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 18,
    alignSelf: "flex-start",
    letterSpacing: 0.5,
  },
  infoText: {
    color: "#4E944F",
    fontSize: 15,
    marginBottom: 18,
    textAlign: "center",
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
  resetButton: {
    width: "100%",
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  resetButtonText: {
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
  successText: {
    color: "#2E7D32",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 18,
    fontWeight: "bold",
  },
});
