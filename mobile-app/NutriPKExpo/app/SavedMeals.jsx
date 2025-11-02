import React, { useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";

function formatTime(datetime) {
  const parts = datetime.split(',');
  return parts.length > 1 ? parts[1].trim() : datetime;
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
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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
      // group by date
      const groups = {};
      meals.forEach(meal => {
        const date = meal.timestamp && meal.timestamp.split(',')[0].trim();
        if (!date) return;
        if (!groups[date]) groups[date] = [];
        groups[date].push(meal);
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
              {meals.map((meal, idx) => (
                <View key={idx} style={styles.card}>
                  <Image source={{ uri: meal.image }} style={styles.image} />
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
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
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
