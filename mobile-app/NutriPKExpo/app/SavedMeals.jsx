import React, { useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";

function formatTime(datetime) {
  // Return only time part in Pakistan time (UTC+5) as "h:mm AM/PM" without seconds.
  if (!datetime) return '';
  try {
    const dateObj = parseToDateObj(datetime);
    if (!dateObj) return '';

    // Compute Pakistan time by adding +5 hours to absolute epoch ms.
    const PK_OFFSET_MS = 5 * 60 * 60 * 1000; // UTC+5
    const pkMs = dateObj.getTime() + PK_OFFSET_MS;
    const pkDate = new Date(pkMs);

    // Use UTC getters on pkDate to get the PK local components regardless of client TZ
    let hours = pkDate.getUTCHours();
    const minutes = pkDate.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const minsStr = minutes.toString().padStart(2, '0');
    return `${hours}:${minsStr} ${ampm}`;
  } catch (e) {
    return '';
  }
}

// Helper: robustly parse various timestamp formats into a Date object.
function parseToDateObj(datetime) {
  if (!datetime) return null;
  // If it's already a Date
  if (datetime instanceof Date) return datetime;

  // Normalize common cases
  const s = String(datetime).trim();

  // Case: ISO with T or with Z
  if (s.includes('T') || /\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d)) return d;
  }

  // Case: 'YYYY-MM-DD HH:MM:SS(.micro)?' (likely UTC) -> treat as UTC by appending Z
  const ymdSpaceTime = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;
  if (ymdSpaceTime.test(s)) {
    const iso = s.replace(' ', 'T') + 'Z';
    const d = new Date(iso);
    if (!isNaN(d)) return d;
  }

  // Case: 'dd/mm/yyyy, HH:MM:SS' or 'dd/mm/yyyy, HH:MM'
  if (s.includes('/')) {
    const parts = s.split(',');
    const datePart = parts[0].trim();
    const timePart = parts[1] ? parts[1].trim() : '';
    const [d, m, y] = datePart.split('/').map(Number);
    if (d && m && y) {
      let hours = 0, mins = 0, secs = 0;
      if (timePart) {
        const t = timePart.split(':').map(tk => Number(tk));
        if (!isNaN(t[0])) hours = t[0];
        if (!isNaN(t[1])) mins = t[1];
        if (!isNaN(t[2])) secs = t[2];
      }
      const dt = new Date(y, m - 1, d, hours, mins, secs);
      if (!isNaN(dt)) return dt;
    }
  }

  // Fallback: try Date constructor (may treat as local)
  const fallback = new Date(s);
  if (!isNaN(fallback)) return fallback;
  return null;
}

function getDayLabel(dateStr) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const [d, m, y] = dateStr.split('/').map(Number);
  const dateObj = new Date(y, m - 1, d);
  if (dateObj.toDateString() === today.toDateString()) return "Today";
  if (dateObj.toDateString() === yesterday.toDateString()) return "Yesterday";
  return dateStr;
}

export default function SavedMeals() {
  const [groupedMeals, setGroupedMeals] = useState({});
  const [brokenImages, setBrokenImages] = useState({});
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const BACKEND_BASE = 'http://127.0.0.1:8000';

  // Delete meal handler (improved)
  const handleDeleteMeal = async (meal) => {
    if (!meal._id) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/user/delete-meal?meal_id=${meal._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const text = await res.text();
      console.log('Delete meal response:', res.status, text);
      if (!res.ok) {
        Alert.alert('Error', 'Failed to delete from server: ' + text);
      }
      fetchMeals();
    } catch (e) {
      console.log('Error deleting meal from backend:', e);
      Alert.alert('Error', 'Network error: ' + e.message);
    }
  };

  const fetchMeals = async () => {
    setLoading(true);
    try {
      // Replace with backend API call
      // You may need to pass user email if required by backend
      const email = await getUserEmail();
      if (!email) {
        setGroupedMeals({});
        setLoading(false);
        return;
      }
      const res = await fetch(`http://127.0.0.1:8000/api/user/all-meals?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error('Failed to fetch meals');
      const data = await res.json();
      const meals = data.meals || [];
  console.log('Fetched meals count:', meals.length);
  console.log('Sample meal.image values:', meals.slice(0,10).map(m => m.image));
      // group by date (dd/mm/yyyy) and sort
      const groups = {};
      meals.forEach(meal => {
        // parse to Date and then derive PK date string to ensure consistent grouping
        const dt = parseToDateObj(meal.timestamp);
        let dateStr = '';
        if (dt) {
          // compute date in Asia/Karachi timezone by using toLocaleString and extracting date parts
          const pk = new Date(dt.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
          const d = pk.getDate().toString().padStart(2, '0');
          const m = (pk.getMonth() + 1).toString().padStart(2, '0');
          const y = pk.getFullYear();
          dateStr = `${d}/${m}/${y}`;
        } else {
          // fallback to original date part
          dateStr = meal.timestamp && meal.timestamp.split(',')[0].trim();
        }
        if (!dateStr) return;
        if (!groups[dateStr]) groups[dateStr] = [];
        groups[dateStr].push(meal);
      });
      // Sort meals within each group: latest first
      Object.keys(groups).forEach(key => {
        groups[key].sort((a, b) => {
          const da = parseToDateObj(a.timestamp) || new Date(0);
          const db = parseToDateObj(b.timestamp) || new Date(0);
          return db - da;
        });
      });
      // Debug resolved URIs for first few meals
      Object.keys(groups).slice(0,3).forEach(k => {
        console.log('Group', k, 'resolved images:', groups[k].slice(0,5).map((m, i) => resolveImageSource(m.image, BACKEND_BASE)));
      });
      setGroupedMeals(groups);
    } catch (e) {
      setGroupedMeals({});
      console.log('Error fetching meals:', e);
    }
    setLoading(false);
  };

  // Helper to get user email (from AsyncStorage or context)
  const getUserEmail = async () => {
    // If you have user context, use that. Otherwise, fallback to AsyncStorage
    try {
      const email = await AsyncStorage.getItem('email');
      return email;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  // Refresh meals every time the page is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchMeals();
    }, [])
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Saved Meals</Text>
        {loading ? (
          <Text style={styles.empty}>Loading...</Text>
        ) : Object.keys(groupedMeals).length === 0 ? (
          <Text style={styles.empty}>No meals saved yet.</Text>
        ) : (
          Object.entries(groupedMeals).sort((a, b) => {
            // sort by date descending
            const [d1, m1, y1] = a[0].split('/').map(Number);
            const [d2, m2, y2] = b[0].split('/').map(Number);
            const dateA = new Date(y1, m1 - 1, d1);
            const dateB = new Date(y2, m2 - 1, d2);
            return dateB - dateA;
          }).map(([date, meals]) => (
            <View key={date}>
              <Text style={styles.dayLabel}>{getDayLabel(date)}</Text>
              {meals.map((meal, idx) => {
                const key = `${date}-${idx}`;
                const resolved = resolveImageSource(meal.image, BACKEND_BASE);
                return (
                <View key={idx} style={styles.card}>
                  <Image
                    source={brokenImages[key] ? require('../assets/images/food.jpg') : resolved}
                    style={styles.image}
                    onError={() => setBrokenImages(prev => ({ ...prev, [key]: true }))}
                  />
                  <View style={styles.cardContent}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.timestamp}>{formatTime(meal.timestamp)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity style={styles.detailsBtn} onPress={() => router.push({ pathname: '/MealDetails', params: { meal: JSON.stringify(meal) } })}>
                        <Text style={styles.detailsText}>View Details</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteMeal(meal)}>
                        <Text style={styles.deleteIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// Resolve different kinds of image values into an Image source.
function resolveImageSource(img, backendBase) {
  if (!img) return require('../assets/images/food.jpg');
  const s = String(img || '').trim();
  // If server-served static path like '/static/..' prefix with backend base
  if (s.startsWith('/')) {
    return { uri: backendBase + s };
  }
  // If already absolute URL
  if (s.startsWith('http://') || s.startsWith('https://')) {
    return { uri: s };
  }
  // blob:, file:, content: URIs may work on the running device; return as-is
  if (s.startsWith('blob:') || s.startsWith('file:') || s.startsWith('content:')) {
    return { uri: s };
  }
  // Fallback: treat as absolute URI
  return { uri: s };
}

const styles = StyleSheet.create({
  backArrow: {
    position: 'absolute',
    top: 18,
    left: 10,
    zIndex: 10,
    padding: 6,
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#0e4f11ff',
    alignSelf: 'center',
  },
  empty: {
    fontSize: 16,
    color: '#888',
    alignSelf: 'center',
    marginTop: 40,
  },
  dayLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 18,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 18,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    padding: 12,
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  mealName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0e4f11ff',
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 13,
    color: '#888',
    position: 'absolute',
    top: 0,
    right: 0,
  },
  detailsBtn: {
    marginTop: 10,
    backgroundColor: '#FF6F61',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  detailsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
    deleteBtn: {
    marginLeft: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 6,
    alignSelf: 'flex-start',
  },
  deleteIcon: {
    fontSize: 18,
    color: '#FF6F61',
    fontWeight: 'bold',
  },
});
