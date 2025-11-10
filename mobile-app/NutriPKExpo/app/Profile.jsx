import React, { useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { useRouter } from "expo-router";
import { BACKEND_BASE } from './config';

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
  const [showTargets, setShowTargets] = useState(false);
  const [targetCalories, setTargetCalories] = useState('');
  const [targetProtein, setTargetProtein] = useState('');
  const [targetCarbs, setTargetCarbs] = useState('');
  const [targetFats, setTargetFats] = useState('');

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
        // Username should be editable but default to whatever server returned (if any)
        setUsername(data.username || '');
        setAge(data.age ? String(data.age) : "");
        setHeight(data.height ? String(data.height) : "");
        setWeight(data.weight ? String(data.weight) : "");
        setProfileImage(data.profile_image_url ? (data.profile_image_url.startsWith('http') ? data.profile_image_url : `${BACKEND_BASE}${data.profile_image_url}`) : null);
        setBMI(getBMI(data.weight, data.height));
  setTargetCalories(data.target_calories ? String(data.target_calories) : '');
  setTargetProtein(data.target_protein ? String(data.target_protein) : '');
  setTargetCarbs(data.target_carbs ? String(data.target_carbs) : '');
  setTargetFats(data.target_fats ? String(data.target_fats) : '');
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
  // include username when updating profile (backend will ignore if not supported)
  formData.append('username', username ? username : '');
  formData.append('target_calories', targetCalories || '');
  formData.append('target_protein', targetProtein || '');
  formData.append('target_carbs', targetCarbs || '');
  formData.append('target_fats', targetFats || '');

      // Attach profile image correctly for web/native
      if (profileImage) {
        try {
          if (Platform.OS === 'web') {
            // On web: if profileImage is a data: or file: URI, convert to blob and append
            if (profileImage.startsWith('data:') || profileImage.startsWith('file:')) {
              try {
                const res = await fetch(profileImage);
                const blob = await res.blob();
                const file = new File([blob], 'profile.jpg', { type: blob.type || 'image/jpeg' });
                formData.append('profile_image_file', file);
                console.log('Profile (web) appended file from data/file uri');
              } catch (weberr) {
                console.log('Failed to convert web data/file uri to blob:', weberr);
              }
            }
            // if it's http(s) string, don't re-upload
          } else {
            // Native: append uri object directly — RN fetch knows how to handle this for multipart
            const uri = profileImage;
            const uriParts = uri.split('.');
            const fileExt = uriParts[uriParts.length - 1] || 'jpg';
            const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
            const fileObj = { uri: uri, name: `profile.${fileExt}`, type: mimeType };
            formData.append('profile_image_file', fileObj);
            console.log('Profile upload (native) appended uri object:', fileObj);
          }
        } catch (attachErr) {
          console.log('Error while attaching profile image to FormData:', attachErr);
        }
      }
      console.log('Submitting profile update to', `${BACKEND_BASE}/api/user/profile/${email}`, 'profileImage:', profileImage, 'Platform:', Platform.OS, 'auth present:', !!token);

      const response = await fetch(`${BACKEND_BASE}/api/user/profile/${email}`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          // Do NOT set Content-Type here; fetch will set it with boundary
        },
        body: formData,
      });

      const text = await response.text();
      let data = null;
      try { data = JSON.parse(text); } catch (e) { data = text; }
      console.log('Profile update response status:', response.status, 'body:', data);
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
            const imgUrl = data && data.profile_image_url ? (String(data.profile_image_url).startsWith('http') ? data.profile_image_url : `${BACKEND_BASE}${data.profile_image_url}`) : null;
            if (imgUrl) {
              setProfileImage(imgUrl);
              setImageBroken(false);
            }
            // update targets from response if present
            setTargetCalories(data.target_calories ? String(data.target_calories) : '');
            setTargetProtein(data.target_protein ? String(data.target_protein) : '');
            setTargetCarbs(data.target_carbs ? String(data.target_carbs) : '');
            setTargetFats(data.target_fats ? String(data.target_fats) : '');
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
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Green header card (top area similar to screenshot) */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>My Account</Text>
          <Text style={styles.headerSubtitle}>Manage your profile</Text>
        </View>
        <TouchableOpacity onPress={editing ? pickImage : undefined} style={styles.headerAvatarWrap}>
          <Image
            source={(!imageBroken && profileImage) ? { uri: profileImage } : require("../assets/images/logo.jpg")}
            style={styles.headerAvatar}
            onError={() => setImageBroken(true)}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {loading ? (
          <Text>Loading...</Text>
        ) : error ? (
          <Text style={{ color: "red" }}>
            {typeof error === 'object' ? JSON.stringify(error) : error}
          </Text>
        ) : user ? (
          <>
            <View style={styles.rowInfo}>
              <View style={styles.infoCol}>
                <Text style={styles.name}>{username || (user && user.username) || ''}</Text>
                <Text style={styles.email}>{email}</Text>
              </View>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[styles.input, !editing && styles.inputReadOnly]}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your display name"
                editable={editing}
                selectTextOnFocus={editing}
              />

              <Text style={styles.label}>Age</Text>
              <TextInput
                style={[styles.input, !editing && styles.inputReadOnly]}
                value={age}
                onChangeText={setAge}
                placeholder="Age"
                keyboardType="numeric"
                editable={editing}
              />
{/* Input field for user's height in cm. Editable only in edit mode.*/}
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={[styles.input, !editing && styles.inputReadOnly]}
                value={height}
                onChangeText={setHeight}
                placeholder="Height in cm "
                keyboardType="numeric"
                editable={editing}
              />
           {/* Input field for user's weight in kg. Editable only in edit mode.*/}
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={[styles.input, !editing && styles.inputReadOnly]}
                value={weight}
                onChangeText={setWeight}
                placeholder="Weight in kg "
                keyboardType="numeric"
                editable={editing}
              />

              <Text style={styles.label}>BMI</Text>
              <Text style={styles.bmiText}>{bmi} {bmi !== '-' && `(${getBMICategory(bmi)})`}</Text>

                <TouchableOpacity onPress={() => setShowTargets(s => !s)} style={{marginTop:8}}>
                  <Text style={[styles.label, {color:'#0e4f11ff'}]}>Target Nutrients (tap to view/edit)</Text>
                </TouchableOpacity>
                {showTargets && (
                  <View style={{width:'100%', backgroundColor:'#F5FFF6', padding:10, borderRadius:10, marginTop:8}}>
                    <Text style={{fontWeight:'700'}}>Calories</Text>
                    <TextInput style={styles.input} value={targetCalories} onChangeText={setTargetCalories} keyboardType='numeric' editable={editing} />
                    <Text style={{fontWeight:'700', marginTop:6}}>Protein (g)</Text>
                    <TextInput style={styles.input} value={targetProtein} onChangeText={setTargetProtein} keyboardType='numeric' editable={editing} />
                    <Text style={{fontWeight:'700', marginTop:6}}>Carbs (g)</Text>
                    <TextInput style={styles.input} value={targetCarbs} onChangeText={setTargetCarbs} keyboardType='numeric' editable={editing} />
                    <Text style={{fontWeight:'700', marginTop:6}}>Fats (g)</Text>
                    <TextInput style={styles.input} value={targetFats} onChangeText={setTargetFats} keyboardType='numeric' editable={editing} />
                  </View>
                )}

              <View style={styles.buttonsRow}>
                {editing ? (
                  <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        ) : null}
      </View>

      {/* Logout placed at the bottom with icon */}
      <TouchableOpacity
        style={[styles.logoutWrap, styles.logoutLeft]}
        onPress={async () => {
          await AsyncStorage.removeItem('jwtToken');
          await AsyncStorage.removeItem('username');
          router.replace('/Login');
        }}
      >
        <Image source={require('../assets/images/logout-icon.png')} style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  scrollContainer: {
    paddingTop: 0, backgroundColor: '#FFF3EC', paddingBottom: 24, alignItems: 'center',
  },
  container: {
    width: '100%', paddingHorizontal: 24, paddingTop: 16,
  },
  headerCard: {
    width: '100%',backgroundColor: '#2E7D32', borderRadius: 4,
    paddingVertical: 18, paddingHorizontal: 20,
    marginTop: 30,marginBottom: 14, flexDirection: 'row',
    alignItems: 'center',justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'column', 
    justifyContent: 'center',

  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
    paddingRight: 20,
  },
  headerSubtitle: {
    color: '#DFF5E0',
    fontSize: 12,
    marginTop: 2,
    paddingRight: 18,
    marginBottom: 4,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#fff',
  },
  headerAvatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginleft: 14,
    marginRight: 0,
    padding: 2,
  },
  rowInfo: {
    width: '100%',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',

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
  avatarWrap: {
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 20,
    padding: 6,
    borderRadius: 50,
    borderwidhth: 2,
    borderColor: "#2E7D32",
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
    flexDirection: 'column',
    paddingRight: 14,

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
    marginRight: 12,
  },
  form: {
    width: '100%',
    marginTop: 6,
    marginBottom: 10,
  },
  label: {
    color: '#4E944F',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  info: {
    fontSize: 15,
    color: "#4E944F",
    marginBottom: 4,
    marginRight: 14,
  },
  infoValue: {
    color: "#2E7D32",
    fontWeight: "bold",

  },
  bmiText: {
    color: '#2E7D32',
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 4,
    fontSize: 14,
  },
  joined: {
    fontSize: 14,
    color: "#A0A0A0",
    marginBottom: 18,
    marginRight: 16,
  },
  input: {
    width: "100%",
    height: 44,
    backgroundColor: "#FFF3EC",
    borderRadius: 8,
    borderWidth: 0,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
    color: "#2E7D32",
  },
  inputReadOnly: {
    backgroundColor: '#F5F5F5',
    color: '#A0A0A0',
    marginBottom: 10,
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
    marginHorizontal: 8,
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
    marginHorizontal: 10,
  },
  editImageText: {
    color: "#4E944F",
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
    marginTop: 6,
  },
  logoutWrap: {
    width: '100%',
    marginTop: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E7E7E7',
  },
  logoutLeft: {
    justifyContent: 'flex-start',
  },
  logoutIcon: {
    width: 22,
    height: 22,
    marginRight: 8,
    tintColor: '#2E7D32',
  },
  logoutText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 16,
  },
});