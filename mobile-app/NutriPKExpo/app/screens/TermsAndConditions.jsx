import React from "react";
import {
  View,Text,
  StyleSheet,TouchableOpacity,ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

const THEME = "#0e4f11ff";

export default function TermsAndConditions() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backTouch}
          onPress={() => router.back()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.paragraphs}>
          Welcome to NutriPK! By using our app, you agree to maintain accurate
          information about your health and activity. NutriPK offers guidance and 
          tracking features to support your health journey, 
          but it is not a substitute for professional medical advice.
        </Text>

        <Text style={styles.paragraphs}>
          We value your privacy your personal information and progress records
          stay protected and are only used to enhance your overall wellness
          experience in the app.
        </Text>

        <Text style={styles.paragraphs}>
          By continuing to use NutriPK, you accept these terms and commit to
          using the app responsibly to achieve your fitness goals.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 2,
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
  paragraphs: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 12,
  },
});
