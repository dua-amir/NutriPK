import { Link } from "expo-router";
import { StyleSheet } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Welcome to the modal</ThemedText>

      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">Return to Home</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
    backgroundColor: "#FFF3EC",
  },
  link: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal:20,
    borderRadius: 8,
  },
});