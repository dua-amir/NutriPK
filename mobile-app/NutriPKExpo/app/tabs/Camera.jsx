import React, { useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform, Modal, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function Home() {
  const router = useRouter();
  const [image, setImage] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNutrients, setShowNutrients] = useState(false);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.canceled) {
        setImage(result.assets[0].uri);
        setPredictions(null);
        setError(null);
      }
    } catch (err) {
      setError("Error accessing image gallery");
    }
  };

  const takePhoto = async () => {
    try {
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.canceled) {
        setImage(result.assets[0].uri);
        setPredictions(null);
        setError(null);
      }
    } catch (err) {
      setError("Error accessing camera");
    }
  };

  const uploadAndPredict = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);

    try {
      // Ensure correct uri for platform
      const fileUri = Platform.OS === 'ios' ? image.replace('file://', '') : image;

      // Get file extension/type (fallback to jpeg)
      const uriParts = fileUri.split('.');
      const fileExt = uriParts[uriParts.length - 1] || 'jpg';
      const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

      const formData = new FormData();

      if (Platform.OS === 'web') {
        // On web, FormData expects a File/Blob, not an object with uri
        const response = await fetch(fileUri);
        const blob = await response.blob();
        const fileName = `photo.${fileExt}`;
        formData.append('file', blob, fileName);
      } else {
        // On native, pass the uri object that fetch understands
        formData.append('file', {
          uri: fileUri,
          name: `photo.${fileExt}`,
          type: mimeType,
        });
      }

      console.log('Uploading image to:', fileUri);

      // If you're running on the Android emulator, replace localhost with 10.0.2.2
      // If on a physical device, use your PC's LAN IP (e.g., http://192.168.x.y:8000)
      const endpoint = 'http://192.168.1.8:8000/api/dish/predict/';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        // Do NOT set Content-Type — let RN/Fetch set the boundary automatically
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Server error', response.status, errText);
        throw new Error(`Server error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      console.log('Prediction:', data);
      setPredictions(data);
    } catch (err) {
      console.error('Upload/predict error:', err);
      setError(`Error: ${err.message}`);
      setPredictions(null);
    } finally {
      setLoading(false);
    }
  };

  const formatConfidence = (confidence) => {
    return (confidence * 100).toFixed(1) + "%";
  };

  // Return only the main nutrient fields (Calories, Carbohydrates, Fats, Protein)
  const getDisplayedNutrients = (nutrients) => {
    if (!nutrients) return [];
    const remainingKeys = Object.keys(nutrients || {});
    const lowerMap = {};
    remainingKeys.forEach(k => { lowerMap[k.toLowerCase()] = k; });

    const order = [
      { label: 'Calories', subs: ['calor'] },
      { label: 'Carbohydrates', subs: ['carbo', 'carb'] },
      { label: 'Fats', subs: ['fat'] },
      { label: 'Protein', subs: ['protein'] },
    ];

    const out = [];
    const taken = new Set();
    for (const item of order) {
      const { label, subs } = item;
      let foundKey = null;
      // find first matching key (case-insensitive) that isn't already taken
      for (const origKey of Object.keys(nutrients)) {
        const lk = origKey.toLowerCase();
        if (taken.has(origKey)) continue;
        if (subs.some(s => lk.includes(s))) {
          foundKey = origKey;
          break;
        }
      }
      if (foundKey) {
        taken.add(foundKey);
        out.push({ label, value: nutrients[foundKey] });
      }
    }
    return out;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Image for Food Recognition</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.cameraButton]} 
          onPress={takePhoto}
        >
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.uploadButton]} 
          onPress={pickImage}
        >
          <Text style={styles.buttonText}>Upload from Gallery</Text>
        </TouchableOpacity>
      </View>

      {image && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.preview} />
          <TouchableOpacity
            style={[
              styles.predictButton,
              loading && styles.predictButtonDisabled
            ]}
            onPress={uploadAndPredict}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.predictButtonText}>Analyzing...</Text>
              </View>
            ) : (
              <Text style={styles.predictButtonText}>🔍 Identify Dish</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
        </View>
      )}

      {predictions && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Results:</Text>
          {predictions.top_predictions.map((pred, index) => (
            <View 
              key={index} 
              style={[
                styles.predictionRow,
                index === 0 && styles.topPrediction
              ]}
            >
              <Text style={[
                styles.dishName,
                index === 0 && styles.topDishName
              ]}>
                {index === 0 ? "🏆 " : "• "}{pred.dish.replace(/_/g, " ")}
              </Text>
              <Text style={[
                styles.confidence,
                index === 0 && styles.topConfidence
              ]}>
                {formatConfidence(pred.confidence)}
              </Text>
            </View>
          ))}
          {predictions.nutrients && (
            <TouchableOpacity
              style={[styles.predictButton, {marginTop:12}]}
              onPress={() => setShowNutrients(true)}
            >
              <Text style={styles.predictButtonText}>📋 View Nutrients</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Nutrients modal */}
      <Modal
        visible={showNutrients}
        animationType="slide"
        onRequestClose={() => setShowNutrients(false)}
      >
        <View style={[styles.container, {paddingTop: 60}]}> 
          <Text style={styles.title}>Nutrients</Text>
          <ScrollView style={{marginTop:12}}>
            {predictions && predictions.nutrients ? (
              getDisplayedNutrients(predictions.nutrients).map((item, i) => (
                <View key={i} style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:8,borderBottomWidth:1,borderBottomColor:'#eee'}}>
                  <Text style={{fontSize:16,color:'#333'}}>{item.label}</Text>
                  <Text style={{fontSize:16,color:'#0D2B3A',fontWeight:'600'}}>{item.value === null ? '—' : String(item.value)}</Text>
                </View>
              ))
            ) : (
              <Text>No nutrient data available.</Text>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.predictButton, {marginTop:16, backgroundColor:'#FF6F61'}]}
            onPress={async () => {
              if (!predictions || !predictions.nutrients) return;
              const email = await AsyncStorage.getItem('email');
              if (!email) return;

              try {
                const formData = new FormData();
                formData.append('name', predictions.top_predictions?.[0]?.dish || 'Unknown Dish');
                formData.append('nutrients', JSON.stringify(predictions.nutrients));
                formData.append('timestamp', new Date().toISOString());
                formData.append('email', email);

                // Attach image file for backend to store. On web, fetch the blob first.
                let fileObj = null;
                if (Platform.OS === 'web') {
                  const resp = await fetch(image);
                  const blob = await resp.blob();
                  const fileName = `photo.jpg`;
                  fileObj = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
                  formData.append('image', fileObj);
                } else {
                  // Native: supply uri/name/type object
                  const uriParts = image.split('.');
                  const fileExt = uriParts[uriParts.length - 1] || 'jpg';
                  const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
                  formData.append('image', {
                    uri: image,
                    name: `photo.${fileExt}`,
                    type: mimeType,
                  });
                }

                const resp = await fetch('http://127.0.0.1:8000/api/user/save-meal', {
                  method: 'POST',
                  body: formData,
                });
                if (!resp.ok) throw new Error('Save failed: ' + resp.status);
                const result = await resp.json();
                // Use returned meal (with server image URL) to store locally
                const savedMeal = result.meal || null;
                if (savedMeal) {
                  const prev = await AsyncStorage.getItem('savedMeals_' + email);
                  const arr = prev ? JSON.parse(prev) : [];
                  // Ensure timestamp and image values are strings for frontend
                  arr.unshift(savedMeal);
                  await AsyncStorage.setItem('savedMeals_' + email, JSON.stringify(arr));
                }
                alert('Meal saved!');
              } catch (err) {
                console.error('Save meal error', err);
                alert('Failed to save meal');
              }
            }}
          >
            <Text style={styles.predictButtonText}>💾 Save Meal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.predictButton, {marginTop:10}]} onPress={() => setShowNutrients(false)}>
            <Text style={styles.predictButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF3EC",
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#0D2B3A",
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cameraButton: {
    backgroundColor: "#FF7F32",
  },
  uploadButton: {
    backgroundColor: "#2E7D32",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  preview: {
    width: 280,
    height: 280,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#FF7F32",
  },
  predictButton: {
    backgroundColor: "#0D2B3A",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 36,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  predictButtonDisabled: {
    opacity: 0.7,
  },
  predictButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorContainer: {
    backgroundColor: "#FFE5E5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 16,
    textAlign: "center",
  },
  resultsContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0D2B3A",
    marginBottom: 12,
  },
  predictionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  topPrediction: {
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  dishName: {
    fontSize: 16,
    color: "#333",
    textTransform: "capitalize",
  },
  topDishName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0D2B3A",
  },
  confidence: {
    fontSize: 16,
    color: "#666",
  },
  topConfidence: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
  },
})