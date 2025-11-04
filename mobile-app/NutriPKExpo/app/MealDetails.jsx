import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function MealDetails() {
  const { meal } = useLocalSearchParams();
  const router = useRouter();
  const mealObj = meal ? JSON.parse(meal) : null;
  const BACKEND_BASE = 'http://192.168.1.8:8000';

  if (!mealObj) return <View style={styles.container}><Text>No meal data found.</Text></View>;

  // Only show main nutrients
  const nutrientMap = {
    Calories: ["calor"],
    Carbohydrates: ["carbo", "carb"],
    Fats: ["fat"],
    Protein: ["protein"],
  };

  const displayedNutrients = [];
  if (mealObj.nutrients) {
    const lowerKeys = Object.keys(mealObj.nutrients).reduce((acc, k) => {
      acc[k.toLowerCase()] = k;
      return acc;
    }, {});
    for (const [label, subs] of Object.entries(nutrientMap)) {
      const foundKey = Object.keys(lowerKeys).find(lk => subs.some(s => lk.includes(s)));
      if (foundKey) {
        displayedNutrients.push({ label, value: mealObj.nutrients[lowerKeys[foundKey]] });
      }
    }
  }

  function resolveImage(img) {
    if (!img) return null;
    const s = String(img).trim();
    if (s.startsWith('/')) return BACKEND_BASE + s;
    return s;
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: resolveImage(mealObj.image) }} style={styles.image} />
      <Text style={styles.name}>{mealObj.name}</Text>
      <Text style={styles.timestamp}>{mealObj.timestamp}</Text>
      <Text style={styles.sectionTitle}>Nutrients</Text>
      {displayedNutrients.length > 0 ? (
        displayedNutrients.map((item) => (
          <View key={item.label} style={styles.nutrientRow}>
            <Text style={styles.nutrientKey}>{item.label}</Text>
            <Text style={styles.nutrientValue}>{item.value === null ? '—' : String(item.value)}</Text>
          </View>
        ))
      ) : (
        <Text>No nutrients data found.</Text>
      )}
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.replace('/tabs/SavedMeals')}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    padding: 16,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 18,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0e4f11ff',
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 14,
    color: '#888',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FF6F61',
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
  },
  nutrientKey: {
    fontWeight: 'bold',
    color: '#0e4f11ff',
  },
  nutrientValue: {
    color: '#333',
  },
  closeBtn: {
    marginTop: 24,
    backgroundColor: '#FF6F61',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
