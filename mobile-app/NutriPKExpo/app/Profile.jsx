import React, { useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const username = "dua"; // TODO: Replace with actual logged-in username (from context or storage)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        console.log('JWT Token:', token);
        const response = await fetch(
          `http://127.0.0.1:8000/api/user/profile/${username}`,
          {
            method: 'GET',
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
            },
          }
        );
        console.log('Profile response status:', response.status);
        if (!response.ok) {
          const data = await response.json();
          setError(data.detail || "Failed to fetch profile");
          setLoading(false);
          return;
        }
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Calculate BMI
  const getBMI = (weight, height) => {
    if (!weight || !height) return "-";
    // Height in cm, convert to meters
    const h = Number(height) / 100;
    const w = Number(weight);
    if (!h || !w) return "-";
    return (w / (h * h)).toFixed(1);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {loading ? (
          <Text>Loading...</Text>
        ) : error ? (
          <Text style={{ color: "red" }}>{error}</Text>
        ) : user ? (
          <>
            <Image
              source={require("../assets/images/logo.jpg")}
              style={styles.avatar}
            />
            <Text style={styles.name}>{user.username}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <Text style={styles.info}>Age: <Text style={styles.infoValue}>{user.age || "-"}</Text></Text>
            <Text style={styles.info}>Height: <Text style={styles.infoValue}>{user.height || "-"} cm</Text></Text>
            <Text style={styles.info}>Weight: <Text style={styles.infoValue}>{user.weight || "-"} kg</Text></Text>
            <Text style={styles.info}>BMI: <Text style={styles.infoValue}>{getBMI(user.weight, user.height)}</Text></Text>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => router.replace("/Login")}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={async () => {
                // Call backend to reset password (mock: send email)
                setError("");
                try {
                  const response = await fetch("http://127.0.0.1:8000/api/user/forgot-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: user.email }),
                  });
                  const data = await response.json();
                  if (!response.ok) {
                    setError(data.detail || "Failed to send reset link");
                  } else {
                    setError(data.msg || "Password reset link sent!");
                  }
                } catch (err) {
                  setError("Network error. Please try again.");
                }
              }}
            >
              <Text style={styles.resetButtonText}>Reset Password</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0E0D5",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: "#2E7D32",
    backgroundColor: "#E0E0D5",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#4E944F",
    marginBottom: 8,
  },
  info: {
    fontSize: 15,
    color: "#4E944F",
    marginBottom: 4,
  },
  infoValue: {
    color: "#2E7D32",
    fontWeight: "bold",
  },
  joined: {
    fontSize: 14,
    color: "#A0A0A0",
    marginBottom: 18,
  },
  input: {
    width: "100%",
    height: 44,
    backgroundColor: "#E0E0D5",
    borderRadius: 8,
    borderWidth: 0,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
    color: "#2E7D32",
  },
  editButton: {
    backgroundColor: "#4E944F",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginBottom: 10,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginBottom: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resetButton: {
    backgroundColor: "#E0E0D5",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginBottom: 10,
  },
  resetButtonText: {
    color: "#2E7D32",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: "#2E7D32",
  },
  logoutButtonText: {
    color: "#2E7D32",
    fontSize: 16,
    fontWeight: "bold",
  },
});