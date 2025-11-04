import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";

export default function AccountCreate() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topArea}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.smallLogo}
            resizeMode="contain"
          />

          <Text style={styles.header}>Let's Get Started!</Text>
          <Text style={styles.sub}>Let's dive in to your account</Text>
        </View>

        <View style={styles.buttonsArea}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.socialBtn}
            onPress={() => router.replace("/SignUp")}
          >
            <Image
              source={require("../../assets/images/google-icon.png")}
              style={styles.icon}
            />
            <Text style={styles.socialText}>Continue with Google</Text>
          </TouchableOpacity>

         <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.9}
            onPress={() => router.replace("/SignUp")}
          >
            <Text style={styles.primaryText}>Sign up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.9}
            onPress={() => router.push("/Login")}
          >
            <Text style={styles.secondaryText}>Sign in</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.privacy}>Privacy Policy  ·  Terms of Service</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF3EC" },
  container: {
    flex: 1,
    backgroundColor: "#FFF3EC",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
  },
  topArea: {
    alignItems: "center",
    marginTop: 80,
  },
  smallLogo: {
    width: 150,
    height: 150,
    marginBottom: 25,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0e4f11ff",
    marginBottom: 6,
  },
  sub: {
    fontSize: 16,
    color: "#7B8794",
    marginBottom: 8,
  },
  buttonsArea: {
    width: "100%",
    alignItems: "center",
    marginTop: 18,
    paddingBottom: 24,
  },
  socialBtn: {
    width: "92%",
    height: 52,
    backgroundColor: "#fff",
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#ECECEC",
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  socialText: {
    fontSize: 15,
    color: "#0D1B1B",
    fontWeight: "600",
  },
  primaryBtn: {
    width: "92%",
    height: 52,
    backgroundColor: "#0e4f11ff",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    width: "92%",
    height: 48,
    backgroundColor: "#F3FBEF",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#0e4f11ff",
  },
  secondaryText: {
    color: "#0e4f11ff",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    alignItems: "center",
    marginBottom: 8,
  },
  privacy: {
    fontSize: 12,
    color: "#9AA0A6",
  },
});