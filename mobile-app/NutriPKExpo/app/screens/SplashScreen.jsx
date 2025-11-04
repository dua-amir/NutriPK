import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Navigate to onboarding after splash
      router.replace("/Onboarding1");
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>NutriPK</Text>
      </View>

      <ActivityIndicator style={styles.spinner} size="large" color="#0e4f11ff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF3EC", 
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 200,
    height: 200,
  },
  title: {
    color: "#0e4f11ff",
    fontSize: 38,
    fontWeight: "700",
    marginTop: 12,
  },
  spinner: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
  },
});