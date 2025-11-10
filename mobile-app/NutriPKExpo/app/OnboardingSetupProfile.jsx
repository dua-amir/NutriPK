import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { BACKEND_BASE } from "./config";
import { useLocalSearchParams, useRouter } from "expo-router";

const OnboardingSetupProfile = ({ navigation, route }) => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [targetCalories, setTargetCalories] = useState("");
  const [targetProtein, setTargetProtein] = useState("");
  const [targetCarbs, setTargetCarbs] = useState("");
  const [targetFats, setTargetFats] = useState("");
  const { email, token } = useLocalSearchParams();
  React.useEffect(() => {
    console.log("Profile email param:", email);
  }, [email]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email) {
      setError("Email not found. Please sign up again.");
      return;
    }
    if (!name || !age || !weight || !height) {
      setError("Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("age", age);
      formData.append("height", height);
      formData.append("weight", weight);
      formData.append("target_calories", targetCalories);
      formData.append("target_protein", targetProtein);
      formData.append("target_carbs", targetCarbs);
      formData.append("target_fats", targetFats);
      const response = await fetch(
        `${BACKEND_BASE}/api/user/profile/${email}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      if (!response.ok) {
        let errorMsg = "Failed to save profile";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            errorMsg = data.detail || errorMsg;
          }
        } catch (e) {}
        setError(errorMsg);
        setLoading(false);
        return;
      }
      // If response is OK, only parse JSON if content-type is application/json
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          await response.json(); // optional, can be used for success message
        }
      } catch (e) {}
      setLoading(false);
      router.push("/Login");
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Setup Your Profile</Text>
        {!email || error ? (
          <Text style={styles.errorText}>
            {error ||
              "Email not found. Please sign up again. (Debug: check navigation params)"}
          </Text>
        ) : null}
        {email ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Age"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Weight (kg)"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Height (cm)"
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
            />
            <Text style={styles.sectionTitle}>Target Nutrients Per Day</Text>
            <TextInput
              style={styles.input}
              placeholder="Calories"
              value={targetCalories}
              onChangeText={setTargetCalories}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Protein (g)"
              value={targetProtein}
              onChangeText={setTargetProtein}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Carbs (g)"
              value={targetCarbs}
              onChangeText={setTargetCarbs}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Fats (g)"
              value={targetFats}
              onChangeText={setTargetFats}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Saving..." : "Save Profile"}
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF3EC",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 18,
    color: "#0e4f11ff",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 18,
    marginBottom: 8,
    color: "#4E944F",
    alignSelf: "flex-start",
  },
  input: {
    width: "100%",
    height: 44,
    backgroundColor: "#F6F8F7",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0e4f11ff",
    marginBottom: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#222",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    fontSize: 14,
    textAlign: "center",
  },
  saveButton: {
    width: "100%",
    backgroundColor: "#4E944F",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
    shadowColor: "#4E944F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonDisabled: {
    backgroundColor: "#A5D6A7",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});

export default OnboardingSetupProfile;
