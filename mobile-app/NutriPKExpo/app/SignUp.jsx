import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRouter } from "expo-router";

// Change this to your PC's local IP address
import { BACKEND_BASE } from './config';
const API_BASE_URL = BACKEND_BASE; // central config

export default function Signup() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [agree, setAgree] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSignup = async (event) => {
    if (event && event.preventDefault) event.preventDefault();
      setError("");
    if (!email || !password || !confirmPassword) {
      setError("Please fill all fields.");
      return;
    }
    // email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
  // Strong password check
  // Original regex had missing escapes after lookahead anchors; use a well-tested pattern
  // Requires at least one lowercase, one uppercase, one digit, one special char, min length 8
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongRegex.test(password)) {
      setError("Password must be at least 8 characters, include a number, a symbol, a lowercase and an uppercase letter.");
      return;
    }
    // Check password length (bcrypt limit is 72 bytes)
    // TextEncoder may not be available in some RN environments; guard with a fallback
    try {
      const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
      if (encoder && encoder.encode(password).length > 72) {
        setError("Password is too long. Please use a shorter password.");
        return;
      }
    } catch (e) {
      // If TextEncoder isn't available, skip the byte-length check (rare on modern RN runtimes)
      // This is a safe degradation for client-side only; server still enforces limits.
      console.warn('TextEncoder not available, skipping byte-length check for password');
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
      router.replace("/Login");
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  // wrapper so button can show immediate feedback even when agree is false
  const onPressSignup = (e) => {
    setError("");
    if (!agree) {
      setError("You must agree to the Terms & Conditions to continue.");
      return;
    }
    handleSignup(e);
  };

  // auto-fill username from email so backend validation (which expects username) still passes
  React.useEffect(() => {
    if (!username && email) {
      const name = email.split("@")[0] || "";
      setUsername(name);
    }
  }, [email]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push("/screens/AccountCreate")}
      >
        <Ionicons name="arrow-back" size={22} color="#0e4f11ff" />
      </TouchableOpacity>

      <View style={styles.cardTop}>
        <Text style={styles.title}>Join NutriPK Today!</Text>
        <Text style={styles.cardSubtitle}>
          Create a NutriPK account to track your meals, stay active, and achieve your health goals.
        </Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.fieldLabel}><Text style={styles.labelText}>Email</Text></View>
        <View style={styles.inputBox}>
          <Image source={require("../assets/images/email-logo.png")} style={styles.fieldIcon} />
          <TextInput
            style={[styles.inputBoxInput, Platform.OS === 'web' && { caretColor: 'transparent' }]}
            placeholder="Email"
            placeholderTextColor="#A0A0A0"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            selectionColor="#0e4f11ff"
            underlineColorAndroid="transparent"
          />
        </View>

        <View style={styles.fieldLabel}><Text style={styles.labelText}>Password</Text></View>
        <View style={styles.inputBox}>
          <Image source={require("../assets/images/password-logo.png")} style={styles.fieldIcon} />
          <TextInput
            style={[styles.inputBoxInput, Platform.OS === 'web' && { caretColor: 'transparent' }]}
            placeholder="Password"
            placeholderTextColor="#A0A0A0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            selectionColor="#0e4f11ff"
            underlineColorAndroid="transparent"
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword((p)=>!p)}>
            <Ionicons name={showPassword?"eye-outline":"eye-off-outline"} size={20} color="#4E944F" />
          </TouchableOpacity>
        </View>

        <View style={styles.fieldLabel}><Text style={styles.labelText}>Confirm Password</Text></View>
        <View style={styles.inputBox}>
          <Image source={require("../assets/images/password-logo.png")} style={styles.fieldIcon} />
          <TextInput
            style={[styles.inputBoxInput, Platform.OS === 'web' && { caretColor: 'transparent' }]}
            placeholder="Confirm Password"
            placeholderTextColor="#A0A0A0"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            selectionColor="#0e4f11ff"
            underlineColorAndroid="transparent"
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword((p)=>!p)}>
            <Ionicons name={showConfirmPassword?"eye-outline":"eye-off-outline"} size={20} color="#4E944F" />
          </TouchableOpacity>
        </View>

        <View style={styles.agreeRow}>
          <TouchableOpacity onPress={() => setAgree(prev=>!prev)} style={styles.agreeCheckbox}>
            {agree && <Ionicons name="checkmark" size={16} color="#0e4f11ff" />}
          </TouchableOpacity>
          <Text style={styles.agreeText}>I agree to Nutrio <Text style={styles.termsText} onPress={() => router.push('/screens/TermsAndConditions')}>Terms & Conditions</Text></Text>
        </View>

      </View>

      <View style={styles.centerSignupPrompt}>
        <Text style={styles.centerPromptText}>Already have an account? <Text style={styles.signinLinkLarge} onPress={() => router.push("/Login")}>Sign In</Text></Text>
      </View>

      <TouchableOpacity
        style={[styles.signupButton, (!agree || loading) && styles.loginButtonDisabled]}
        activeOpacity={0.85}
        onPress={onPressSignup}
        disabled={loading}
      >
        <Text style={styles.signupButtonText}>{loading ? "Signing up..." : "Sign Up"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF3EC",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backButton: {
    position: "absolute",
    left: 14,
    top: 18,
    zIndex: 10,
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
    fontSize: 27,
    fontWeight: "bold",
    color: "#0e4f11ff",
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: "center",
    marginBottom: 12,
  },
  cardTop: {
    width: '100%',
    padding: 18,
    backgroundColor: '#fff0',
  },
  cardSubtitle: {
    color: '#7B8794',
    fontSize: 14,
    marginBottom: 14,
  },
  fieldLabel: {
    width: '100%',
    marginBottom: 6,
  },
  labelText: {
    color: '#0e4f11ff',
    fontSize: 18,
    marginLeft: 6,
    marginBottom: 4,
  },
  inputBox: {
    width: '100%',
    height: 48,
    backgroundColor: '#F6F8F7',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#0e4f11ff',
  },
  fieldIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  inputBoxInput: {
    flex: 1,
    fontSize: 15,
    color: '#222',
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 6,
  },
  agreeCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#0e4f11ff',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  agreeText: {
    color: '#55616A',
    fontSize: 14,
  },
  forgotRight: {
    alignSelf: 'flex-end',
    marginTop: -6,
    marginBottom: 6,
  },
  centerSignupPrompt: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorText: {
    color: 'red',
    marginTop: 8,
    marginBottom: 6,
    fontSize: 14,
  },
  centerPromptText: {
    color: '#55616A',
    fontSize: 14,
  },
  signinLinkLarge: {
    color: '#0e4f11ff',
    fontWeight: '700',
  },
  alreadyAccount: {
    color: '#7B8794',
    fontSize: 13,
  },
  signinLink: {
    color: '#0e4f11ff',
    fontWeight: '600',
  },
  orText: {
    color: '#7B8794',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '70%',
    alignSelf: 'center',
    marginTop: 6,
  },
  socialCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  socialIcon: {
    width: 22,
    height: 22,
  },
  signupButton: {
    width: '92%',
    height: 48,
    backgroundColor: '#0e4f11ff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
  checkboxActive: {
    backgroundColor: "#fff",
  },
  rememberMeText: {
    color: "#4E944F",
    fontSize: 14,
  },
  forgotText: {
    color: "#0e4f11ff",
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
  loginButtonDisabled: {
    backgroundColor: "#B8CBB7",
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
    color: "#0e4f11ff",
    fontSize: 15,
  },
  signupLink: {
    color: "#2E7D32",
    fontWeight: "bold",
    fontSize: 15,
    textDecorationLine: "underline",
  },
  termsText: {
    color: "#0e4f11ff",
    fontWeight: "600",
  },
});