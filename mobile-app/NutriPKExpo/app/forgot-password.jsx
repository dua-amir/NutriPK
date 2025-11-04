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
import Ionicons from "react-native-vector-icons/Ionicons";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState("");
  const BACKEND_BASE = 'http://192.168.1.8:8000';

  const handleReset = async () => {
    setError("");
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    try {
      // Optimistic navigation: open SendOTP screen immediately, then send OTP in background
      router.push(`/screens/SendOTP?email=${encodeURIComponent(email)}`);
      // still send OTP request so backend sends email
  fetch(`${BACKEND_BASE}/api/user/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
        .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
        .then((result) => {
          if (!result.ok) {
            // log or optionally notify user
            console.warn('Failed to send OTP:', result.data);
          }
        })
        .catch((err) => {
          console.warn('Network error sending OTP:', err);
        });
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* header back */}
      <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color="#222" />
      </TouchableOpacity>

      <View style={styles.topContent}>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Please enter your registered email address below. We'll send you a One-Time Password (OTP) to reset your password securely.
        </Text>

        <Text style={styles.label}>Registered Email Address</Text>

        <View style={styles.inputRow}>
          <View style={styles.inputIconWrap}>
            <Ionicons name="mail-outline" size={18} color="#666" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="user@nutripk.com"
            placeholderTextColor="#A0A0A0"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      {/* bottom button */}
      <View style={styles.bottomWrap} pointerEvents="box-none">
        <TouchableOpacity style={styles.sendButton} activeOpacity={0.9} onPress={handleReset}>
          <Text style={styles.sendButtonText}>Send OTP Code</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFF3EC',
    paddingTop: 18,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  headerBack: {
    paddingTop: 8,
    paddingLeft: 4,
  },
  topContent: {
    paddingTop: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0e4f11ff',
    marginTop: 6,
    marginBottom: 8,
  },
  subtitle: {
    color: '#7B8794',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  label: {
    color: '#0e4f11ff',
    fontSize: 16,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  inputIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#222',
  },
  errorText: {
    color: 'red',
    marginTop: 8,
    marginBottom: 6,
  },
  bottomWrap: {
    paddingBottom: 18,
    paddingHorizontal: 10,
  },
  sendButton: {
    backgroundColor: '#0e4f11ff',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
