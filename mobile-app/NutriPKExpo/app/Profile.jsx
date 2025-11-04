import React, { useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { useRouter } from "expo-router";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [imageBroken, setImageBroken] = useState(false);
  const [bmi, setBMI] = useState("-");
  const [editing, setEditing] = useState(false);
  const BACKEND_BASE = 'http://127.0.0.1:8000';

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const storedEmail = await AsyncStorage.getItem('email');
            if (!storedEmail) {
          setError("No email found. Please login again.");
          setLoading(false);
          return;
        }
        setEmail(storedEmail);
        const token = await AsyncStorage.getItem('jwtToken');
        console.log('fetchProfile using token:', !!token);
        const response = await fetch(`${BACKEND_BASE}/api/user/profile/${storedEmail}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Accept': 'application/json',
          },
        });
        console.log('profile fetch response status:', response.status);
        if (response.status === 401) {
          // Token invalid/expired — clear and redirect to login
          await AsyncStorage.removeItem('jwtToken');
          setError('Session expired. Please login again.');
          setLoading(false);
          router.replace('/Login');
          return;
        }
        if (!response.ok) {
          const data = await response.json();
          setError(data.detail || "Failed to fetch profile");
          setLoading(false);
          return;
        }
        const data = await response.json();
        setUser(data);
        setEmail(data.email || "");
        setAge(data.age ? String(data.age) : "");
        setHeight(data.height ? String(data.height) : "");
        setWeight(data.weight ? String(data.weight) : "");
  setProfileImage(data.profile_image_url ? (data.profile_image_url.startsWith('http') ? data.profile_image_url : `http://127.0.0.1:8000${data.profile_image_url}`) : null);
        setBMI(getBMI(data.weight, data.height));
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    setBMI(getBMI(weight, height));
  }, [weight, height]);

  // Calculate BMI and category
  const getBMICategory = (bmi) => {
    if (bmi === "-") return "";
    const value = parseFloat(bmi);
    if (value < 18.5) return "Underweight";
    if (value < 25) return "Normal";
    if (value < 30) return "Overweight";
    return "Obese";
  };

  const getBMI = (weight, height) => {
    if (!weight || !height) return "-";
    const h = Number(height) / 100;
    const w = Number(weight);
    if (!h || !w) return "-";
    return (w / (h * h)).toFixed(1);
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const formData = new FormData();
      formData.append('email', email);
      formData.append('age', age ? age : '0');
      formData.append('height', height ? height : '0');
      formData.append('weight', weight ? weight : '0');

      // Attach profile image correctly for web/native
      if (profileImage) {
        if (Platform.OS === 'web' && profileImage.startsWith('http')) {
          // On web, if it's an existing URL we won't re-upload unless it's a file URI
        } else if (Platform.OS === 'web' && profileImage.startsWith('data:')) {
          // data URI -> convert to blob
          const res = await fetch(profileImage);
          const blob = await res.blob();
          const file = new File([blob], 'profile.jpg', { type: blob.type || 'image/jpeg' });
          formData.append('profile_image_file', file);
        } else if (Platform.OS === 'web' && profileImage.startsWith('file:')) {
          // file: on web (rare) -> fetch then blob
          const res = await fetch(profileImage);
          const blob = await res.blob();
          const file = new File([blob], 'profile.jpg', { type: blob.type || 'image/jpeg' });
          formData.append('profile_image_file', file);
        } else {
          // Native: try to read the local file as base64 and send it as profile_image_data
          try {
            // profileImage is usually file://... on native
            const uri = profileImage;
            // derive extension/mime
            const uriParts = uri.split('.');
            const fileExt = uriParts[uriParts.length - 1] || 'jpg';
            const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
            // Read file as base64 using Expo FileSystem
            const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
            const dataUri = `data:${mimeType};base64,${b64}`;
            formData.append('profile_image_data', dataUri);
            console.log('Profile upload (native) will send base64 data, size:', b64.length, 'mime:', mimeType);
          } catch (err) {
            console.log('FileSystem read failed, attempting fetch fallback:', err);
            // Fallback: try fetching the uri and converting to base64
            try {
              const res = await fetch(profileImage);
              if (res.ok) {
                const buffer = await res.arrayBuffer();
                // convert arrayBuffer to base64
                let binary = "";
                const bytes = new Uint8Array(buffer);
                const chunkSize = 0x8000;
                for (let i = 0; i < bytes.length; i += chunkSize) {
                  binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
                }
                const b64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
                const mimeType = (profileImage.endsWith('.png') || profileImage.indexOf('image/png') !== -1) ? 'image/png' : 'image/jpeg';
                const dataUri = `data:${mimeType};base64,${b64}`;
                formData.append('profile_image_data', dataUri);
                console.log('Profile upload (native) fetch->base64 appended, size:', b64.length);
              } else {
                console.log('Fetch fallback failed:', res.status);
              }
            } catch (err2) {
              console.log('Fetch fallback also failed:', err2);
              // Final fallback: append uri object (older behavior)
              const uriParts = profileImage.split('.');
              const fileExt = uriParts[uriParts.length - 1] || 'jpg';
              const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
              formData.append('profile_image_file', {
                uri: profileImage,
                name: `profile.${fileExt}`,
                type: mimeType,
              });
              console.log('Profile upload (native) fallback will send uri object:', { uri: profileImage, name: `profile.${fileExt}`, type: mimeType });
            }
          }
        }
      }
  console.log('Submitting profile update, profileImage:', profileImage, 'Platform:', Platform.OS, 'sending auth:', !!token);
      
      const response = await fetch(`${BACKEND_BASE}/api/user/profile/${email}`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          // Do NOT set Content-Type here; fetch will set it with boundary
        },
        body: formData,
      });
      const data = await response.json();
      console.log('Profile update response:', response.status, data);
      if (response.ok && (!data.profile_image_url || data.profile_image_url === null)) {
        alert('Profile saved but server did not return an image URL. Check backend logs.');
      }
      if (!response.ok) {
        setError(data.detail || "Failed to update profile");
      } else {
        setUser(data);
        setEditing(false);
        setError("");
            // Normalize returned profile image URL to absolute; update only if backend returned one
            const imgUrl = data.profile_image_url ? (data.profile_image_url.startsWith('http') ? data.profile_image_url : `${BACKEND_BASE}${data.profile_image_url}`) : null;
            if (imgUrl) {
              setProfileImage(imgUrl);
              setImageBroken(false);
            }
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
          setProfileImage(result.assets[0].uri); // This line remains unchanged
          setImageBroken(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {loading ? (
          <Text>Loading...</Text>
        ) : error ? (
          <Text style={{ color: "red" }}>
            {typeof error === 'object' ? JSON.stringify(error) : error}
          </Text>
        ) : user ? (
          <>
            <TouchableOpacity onPress={editing ? pickImage : undefined}>
              <Image
                source={(!imageBroken && profileImage) ? { uri: profileImage } : require("../assets/images/logo.jpg")}
                style={styles.avatar}
                onError={() => setImageBroken(true)}
              />
              {editing && <Text style={styles.editImageText}>Change Photo</Text>}
            </TouchableOpacity>
            <Text style={styles.name}>{username}</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.email}>{email}</Text>
            )}
            <View style={{ width: '100%' }}>
              <Text style={styles.info}>Age:</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  placeholder="Age"
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.infoValue}>{age || "-"}</Text>
              )}
              <Text style={styles.info}>Height (cm):</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="Height in cm"
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.infoValue}>{height || "-"}</Text>
              )}
              <Text style={styles.info}>Weight (kg):</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Weight in kg"
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.infoValue}>{weight || "-"}</Text>
              )}
              <Text style={styles.info}>BMI:</Text>
              <Text style={styles.infoValue}>
                {bmi} {bmi !== "-" && `(${getBMICategory(bmi)})`}
              </Text>
            </View>
            {editing ? (
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={async () => {
                await AsyncStorage.removeItem('jwtToken');
                await AsyncStorage.removeItem('username');
                router.replace("/Login");
              }}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
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
  editImageText: {
    color: "#4E944F",
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
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