import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";

export default function Onboarding2() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../assets/images/onboarding2.png")}
          style={styles.heroImage}
          resizeMode="contain"
        />

        <Text style={styles.title}>Personalized plans{"\n"}that fit you</Text>
        <Text style={styles.subtitle}>
          Get meal suggestions, track macros, and reach your goals with simple
          daily actions.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => router.push("/Onboarding1")}
            style={[styles.button, styles.ghost]}
          >
            <Text style={[styles.buttonText, styles.ghostText]}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/screens/AccountCreate")}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF3EC",
  },
  heroImage: {
    width: "92%",
    height: 260,
    alignSelf: "center",
    marginBottom: 18,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#0e4f11ff",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#33475B",
    marginBottom: 28,
  },
  actions: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: "#0e4f11ff",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#0e4f11ff",
  },
  ghostText: {
    color: "#0e4f11ff",
  },
});
