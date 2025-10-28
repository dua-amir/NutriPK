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
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRouter } from "expo-router";

// Change this to your PC's local IP address
const API_BASE_URL = "http://127.0.0.1:8000"; // Use localhost for local development

export default function Signup() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSignup = async (event) => {
    if (event && event.preventDefault) event.preventDefault();
    setError("");
    if (!username || !email || !password || !confirmPassword) {
      setError("Please fill all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    // Check password length (bcrypt limit is 72 bytes)
    const encoder = new TextEncoder();
    if (encoder.encode(password).length > 72) {
      setError("Password is too long. Please use a shorter password.");
      return;
    }
    setLoading(true);
    try {
  const response = await fetch(`${API_BASE_URL}/api/user/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.detail || "Signup failed");
        setLoading(false);
        return;
      }
      setLoading(false);
  router.replace("/Home");
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

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
        <Text style={styles.cardTitle}>Sign up</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#A0A0A0"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#A0A0A0"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Password"
              placeholderTextColor="#A0A0A0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={22}
                color="#4E944F"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Confirm Password"
              placeholderTextColor="#A0A0A0"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                size={22}
                color="#4E944F"
              />
            </TouchableOpacity>
          </View>
          {error ? (
            <Text style={{ color: "red", marginBottom: 8 }}>{error}</Text>
          ) : null}
          <TouchableOpacity
            style={styles.signupButton}
            activeOpacity={0.85}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.signupButtonText}>
              {loading ? "Signing up..." : "Sign Up"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.orText}>or</Text>
          <TouchableOpacity
            style={styles.googleButton}
            activeOpacity={0.85}
            onPress={() => router.replace("/Home")}
          >
            <Image
              source={require("../assets/images/google-icon.png")}
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace("/Login")}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    color: "#0e4f11ff",
    marginBottom: 18,
    alignSelf: "flex-start",
    letterSpacing: 0.5,
  },
  subtitle: {
    display: "none",
  },
  inputContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 0,
  },
  input: {
    width: "100%",
    height: 44,
    backgroundColor: "#E0E0D5",
    borderRadius: 8,
    borderWidth: 0,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
    color: "#0e4f11ff",
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  eyeButton: {
    padding: 8,
    marginLeft: -36,
    zIndex: 1,
  },
  signupButton: {
    width: "100%",
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 2,
  },
  signupButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 0.2,
  },
  orText: {
    color: "#0e4f11ff",
    fontSize: 15,
    marginVertical: 10,
    fontWeight: "500",
    textAlign: "center",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0E0D5",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 0,
    minWidth: 260,
    justifyContent: "center",
    marginBottom: 8,
  },
  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  googleButtonText: {
    color: "#2E7D32",
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 0.2,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  loginText: {
    color: "#2E7D32",
    fontSize: 15,
  },
  loginLink: {
    color: "#2E7D32",
    fontWeight: "bold",
    fontSize: 15,
    textDecorationLine: "underline",
  },
});