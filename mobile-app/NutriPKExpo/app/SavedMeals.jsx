import React, { useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
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

  const fetchMeals = async () => {
    setLoading(true);
    const email = await AsyncStorage.getItem('email');
    console.log('Fetched email:', email);
    if (!email) {
      setGroupedMeals({});
      setLoading(false);
      return;
    }
    const saved = await AsyncStorage.getItem('savedMeals_' + email);
    console.log('Fetched savedMeals:', saved);
    let meals = [];
    if (saved) {
      try {
        meals = JSON.parse(saved);
      } catch (e) {
        console.log('Error parsing savedMeals:', e);
      }
    }
    console.log('Parsed meals:', meals);
    // group by date
    const groups = {};
    meals.forEach(meal => {
      const date = meal.timestamp && meal.timestamp.split(',')[0].trim();
      if (!date) return;
      if (!groups[date]) groups[date] = [];
      groups[date].push(meal);
    });
    console.log('Grouped meals:', groups);
    setGroupedMeals(groups);
    setLoading(false);
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
                    <TouchableOpacity style={styles.detailsBtn} onPress={() => router.push({ pathname: '/MealDetails', params: { meal: JSON.stringify(meal) } })}>
                      <Text style={styles.detailsText}>View Details</Text>
                    </TouchableOpacity>
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
});
