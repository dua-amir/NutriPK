import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export default function Onboarding1() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Track Your{"\n"}
          Calories &{"\n"}
          Nutrition
        </Text>

        <View style={styles.accent} />

        <View style={styles.imageWrap}>
          <Image
            source={require("../assets/images/onboarding1.jpg")}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Non-clickable label as requested */}
        <Text style={styles.ctaLabel}>Snap It! Scan It!</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => router.replace("/Login")}
            style={[styles.button, styles.ghost]}
          >
            <Text style={[styles.buttonText, styles.ghostText]}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/Onboarding2")}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Next</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 48,
    lineHeight: 54,
    fontWeight: "800",
    color: "#0e4f11ff",
  },
  accent: {
    width: 60,
    height: 6,
    backgroundColor: "#0e4f11ff",
    borderRadius: 6,
    marginTop: 12,
    marginBottom: 18,
  },
  imageWrap: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 22,
  },
  heroImage: {
    width: Math.min(width * 0.82, 360),
    height: Math.min(width * 0.82, 360),
    borderRadius: Math.min(width * 0.82, 360) / 2,
    borderWidth: 3,
    borderColor: "#0e4f11ff",
    overflow: "hidden",
  },
  cta: {
    alignSelf: "center",
    backgroundColor: "#0e4f11ff",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 28,
    marginTop: 12,
  },
  ctaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  ctaLabel: {
    alignSelf: "center",
    color: "#0e4f11ff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },
  actions: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    marginTop: 18,
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