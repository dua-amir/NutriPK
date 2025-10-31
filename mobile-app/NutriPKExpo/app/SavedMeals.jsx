import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";

export default function SavedMeals() {
  const [meals, setMeals] = useState([]);
  const router = useRouter();


  useEffect(() => {
    const fetchMeals = async () => {
      const saved = await AsyncStorage.getItem('savedMeals');
      if (saved) setMeals(JSON.parse(saved));
    };
    fetchMeals();
  }, []);

  // Back arrow button handler
  const goBack = () => {
    router.replace("/Home");
  };

  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity style={styles.backArrow} onPress={goBack}>
        <Text style={{fontSize:28, color:'#0e4f11ff'}}>←</Text>
      </TouchableOpacity>
      <ScrollView>
        <Text style={styles.title}>Saved Meals</Text>
        {meals.length === 0 ? (
          <Text style={styles.empty}>No meals saved yet.</Text>
        ) : (
          meals.map((meal, idx) => (
            <View key={idx} style={styles.card}>
              <Image source={{ uri: meal.image }} style={styles.image} />
              <View style={styles.cardContent}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.timestamp}>{meal.timestamp}</Text>
                <TouchableOpacity style={styles.detailsBtn} onPress={() => router.push({ pathname: '/MealDetails', params: { meal: JSON.stringify(meal) } })}>
                  <Text style={styles.detailsText}>View Details</Text>
                </TouchableOpacity>
              </View>
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
