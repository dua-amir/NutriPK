import React from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRouter } from "expo-router";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);
      const response = await fetch("http://127.0.0.1:8000/api/user/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      const data = await response.json();
      console.log('Login API response:', data);
      if (!response.ok) {
        let errorMsg = "Login failed";
        if (typeof data.detail === "string") {
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMsg = data.detail.map(e => e.msg).join("\n");
        } else if (data.detail && typeof data.detail === "object" && data.detail.msg) {
          errorMsg = data.detail.msg;
        }
        setError(errorMsg);
        setLoading(false);
        return;
      }
      // Store JWT token and email
      if (data.access_token) {
        await AsyncStorage.setItem('jwtToken', data.access_token);
      }
      // Save email for profile fetch
      await AsyncStorage.setItem('email', email);
      setLoading(false);
      router.replace("/tabs");
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/logo.jpg")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>NutriPK</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sign in</Text>
        <View style={styles.inputContainer}>
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
          <View style={styles.rowBetween}>
            <TouchableOpacity
              style={styles.rememberMeRow}
              onPress={() => setRememberMe((prev) => !prev)}
              activeOpacity={0.7}
            >
              <View style={styles.checkbox}>
                {rememberMe && (
                  <Ionicons name="checkmark" size={16} color="#2E7D32" />
                )}
              </View>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/forgot-password")}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          {error ? (
            <Text style={{ color: "red", marginBottom: 8 }}>{error}</Text>
          ) : null}
          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? "Logging in..." : "Login"}
            </Text>
          </TouchableOpacity>
          {/* <Text style={styles.orText}>or</Text>
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
          </TouchableOpacity> */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/SignUp")}>
              <Text style={styles.signupLink}>Create account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 8,
  },
  rememberMeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#0e4f11ff",
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0E0D5",
  },
  rememberMeText: {
    color: "#4E944F",
    fontSize: 14,
  },
  forgotText: {
    color: "#4E944F",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 2,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 0.2,
  },
  orText: {
    color: "#4E944F",
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
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  signupText: {
    color: "#4E944F",
    fontSize: 15,
  },
  signupLink: {
    color: "#2E7D32",
    fontWeight: "bold",
    fontSize: 15,
    textDecorationLine: "underline",
  },
});