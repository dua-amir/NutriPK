import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function Home() {
  const [image, setImage] = useState(null);
  const [dishName, setDishName] = useState("");
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setDishName("");
    }
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setDishName("");
    }
  };

  const uploadAndPredict = async () => {
    if (!image) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", {
      uri: image,
      name: "photo.jpg",
      type: "image/jpeg",
    });
    try {
      const response = await fetch("http://127.0.0.1:8000/api/predict-dish", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });
      const data = await response.json();
      setDishName(data.dish || "Unknown");
    } catch (err) {
      setDishName("Error predicting dish");
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home - Dish Recognition</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Upload Image</Text>
        </TouchableOpacity>
      </View>
      {image && <Image source={{ uri: image }} style={styles.preview} />}
      {image && (
        <TouchableOpacity
          style={styles.predictButton}
          onPress={uploadAndPredict}
          disabled={loading}
        >
          <Text style={styles.predictButtonText}>
            {loading ? "Predicting..." : "Predict Dish"}
          </Text>
        </TouchableOpacity>
      )}
      {dishName ? (
        <Text style={styles.resultText}>Dish: {dishName}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF3EC",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 18,
    color: "#0D2B3A",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  button: {
    backgroundColor: "#FF7F32",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  preview: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: "#FF7F32",
  },
  predictButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 10,
  },
  predictButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultText: {
    fontSize: 18,
    color: "#0D2B3A",
    fontWeight: "bold",
    marginTop: 12,
  },
});
