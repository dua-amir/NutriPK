import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";

const THEME = "#0e4f11ff";

export default function TermsAndConditions() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backTouch} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.paragraph}>
          Welcome to NutriPK!
          By using our app, you agree to maintain accurate information about your health and activity. NutriPK provides guidance and tracking tools to help you stay healthy, but it should not replace professional medical advice.
        </Text>

        <Text style={styles.paragraph}>
          We respect your privacy, your personal data and progress logs remain secure and are used only to improve your wellness experience within the app.
        </Text>

        <Text style={styles.paragraph}>
          By continuing to use NutriPK, you accept these terms and commit to using the app responsibly to achieve your fitness goals.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  backTouch: {
    padding: 8,
    marginRight: 8,
  },
  backArrow: {
    fontSize: 22,
    color: THEME,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME,
  },
  content: {
    padding: 18,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 12,
  },
});