import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/Onboarding1");
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.containerStyle}>
      <View style={styles.centerWrapper}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logoWrapper}
          resizeMode="contain"
        />
        <Text style={styles.titleWrapper}>NutriPK</Text>
      </View>

      <ActivityIndicator style={styles.spinnerWrapper} size="large" color="#0e4f11ff" />
    </View>
  );
}

const styles = StyleSheet.create({
  containerStyle: {
    flex: 1,
    backgroundColor: "#FFF3EC", 
    alignItems: "center",
    justifyContent: "center",
  },
  centerWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    width: 200,
    height: 200,
    marginBottom: 10, // added slight spacing
  },
  titleWrapper: {
    color: "#0e4f11ff",
    fontSize: 38,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8, // new margin for spacing
  },
  spinnerWrapper: {
    position: "absolute",
    bottom: 50, // slightly adjusted bottom
    alignSelf: "center",
  },
});