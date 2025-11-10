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
         Receive meal recommendations, monitor your nutrients,
          and achieve your targets through easy daily steps.
        </Text>
{/*before login*/}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => router.push("/Onboarding1")}
            style={[styles.button, styles.ghost]}
          >
            <Text style={[styles.buttonText, styles.Texts]}>Back</Text>
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
    width: "91%",
    height: 259,
    alignSelf: "center",
    marginBottom: 17,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 37,
    fontWeight: "802",
    color: "#0e4f11ff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#33475B",
    marginBottom: 30,
  },
  actions: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: "#0e4f11ff",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#0e4f11ff",
  },
  Texts: {
    color: "#0e4f11ff",
  },
});