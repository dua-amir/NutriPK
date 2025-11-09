import React, { useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";

import { parseToDateObj, formatTimePK, formatDatePK } from './utils/dateUtils';
import { BACKEND_BASE } from './config';

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

  // Delete meal handler (improved)
  const handleDeleteMeal = async (meal) => {
    if (!meal._id) return;
    try {
  const res = await fetch(`${BACKEND_BASE}/api/user/delete-meal?meal_id=${meal._id}`, {
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

  // Ask user to confirm deletion before calling backend
  const confirmDeleteMeal = (meal) => {
    Alert.alert(
      'Delete meal',
      'Are you sure you want to delete this meal? It will be removed from your history too.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteMeal(meal) }
      ],
      { cancelable: true }
    );
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
  const res = await fetch(`${BACKEND_BASE}/api/user/all-meals?email=${encodeURIComponent(email)}`);
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
                try {
                  dateStr = formatDatePK(dt);
                } catch (e) {
                  dateStr = null;
                }
              }
        if (!dateStr) {
          // Fallback: try to extract a date-like substring, else tag as Unknown
          if (meal.timestamp && typeof meal.timestamp === 'string') {
            const match = meal.timestamp.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
            dateStr = match ? match[1] : 'Unknown date';
          } else {
            dateStr = 'Unknown date';
          }
        }
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
                <View key={idx} style={[styles.card, { position: 'relative' }]}>
                  <Image
                    source={brokenImages[key] ? require('../assets/images/food.jpg') : resolved}
                    style={styles.image}
                    onError={() => setBrokenImages(prev => ({ ...prev, [key]: true }))}
                  />
                  <View style={styles.cardContent}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.timestamp}>{formatTimePK(meal.timestamp)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity style={styles.detailsBtn} onPress={() => router.push({ pathname: '/MealDetails', params: { meal: JSON.stringify(meal) } })}>
                        <Text style={styles.detailsText}>View Details</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.deleteBtnAbsolute} onPress={() => confirmDeleteMeal(meal)}>
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
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
    backgroundColor: '#FFF3EC',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 30,
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
    color: '#0e4f11ff',
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
    borderRadius: 8,
    padding: 6,
    alignSelf: 'flex-end',
  },
  deleteIcon: {
    fontSize: 18,
    color: '#FF6F61',
    fontWeight: 'bold',
  },
  deleteBtnAbsolute: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
  },
});
