import React, { useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { parseToDateObj, formatDatePK } from './utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Polyline, G, Text as SvgText } from 'react-native-svg';

function getWeekStart(date) {
  const d = parseToDateObj(date) || new Date();
  // convert to PK local date
  const pk = new Date(d.toLocaleString('en-GB', { timeZone: 'Asia/Karachi' }));
  const day = pk.getDay();
  const diff = pk.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  return new Date(pk.setDate(diff));
}

function formatDate(dateStr) {
  return formatDatePK(dateStr);
}

export default function WeeklySummary() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({calories:0,protein:0,carbs:0,fats:0,meals:0});

  const fetchSummary = async () => {
    setLoading(true);
    const email = await AsyncStorage.getItem('email');
    if (!email) {
      setSummary([]);
      setTotals({calories:0,protein:0,carbs:0,fats:0,meals:0});
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`http://192.168.1.8:8000/api/user/weekly-summary?email=${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error('Failed to fetch summary');
      const data = await response.json();
      setSummary(data.summary || []);
      setTotals(data.totals || {calories:0,protein:0,carbs:0,fats:0,meals:0});
    } catch (err) {
      setSummary([]);
      setTotals({calories:0,protein:0,carbs:0,fats:0,meals:0});
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchSummary();
    }, [])
  );

  // Prepare graph data
  const graphHeight = 120;
  const graphWidth = 320;
  const padding = 30;
  const days = summary.length;
  // Get max for scaling
  const maxVal = Math.max(
    ...summary.map(d => Math.max(d.totalCalories, d.totalProtein, d.totalCarbs, d.totalFats)),
    1
  );
  // Helper to get polyline points
  const getPoints = (key) => {
    return summary.map((d, i) => {
      const x = padding + (i * (graphWidth - 2 * padding) / (days - 1));
      const y = graphHeight - padding - ((d[key] / maxVal) * (graphHeight - 2 * padding));
      return `${x},${y}`;
    }).join(' ');
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Summary</Text>
      {loading ? (
        <Text style={styles.empty}>Loading...</Text>
      ) : summary.length === 0 ? (
        <Text style={styles.empty}>No meals found in last 7 days.</Text>
      ) : (
        <>
          {/* Top card with totals */}
          <View style={styles.totalsCard}>
            <Text style={styles.totalsTitle}>This Week (Mon-Sun)</Text>
            <View style={styles.totalsRow}><Text style={styles.totalsKey}>Meals</Text><Text style={styles.totalsValue}>{totals.meals}</Text></View>
            <View style={styles.totalsRow}><Text style={styles.totalsKey}>Calories</Text><Text style={[styles.totalsValue,{color:'#FF6F61'}]}>{totals.calories}</Text></View>
            <View style={styles.totalsRow}><Text style={styles.totalsKey}>Protein</Text><Text style={[styles.totalsValue,{color:'#4E944F'}]}>{totals.protein}g</Text></View>
            <View style={styles.totalsRow}><Text style={styles.totalsKey}>Carbs</Text><Text style={[styles.totalsValue,{color:'#2196F3'}]}>{totals.carbs}g</Text></View>
            <View style={styles.totalsRow}><Text style={styles.totalsKey}>Fats</Text><Text style={[styles.totalsValue,{color:'#FFC107'}]}>{totals.fats}g</Text></View>
          </View>
          {/* Graph */}
          <View style={styles.graphBox}>
            <Svg height={graphHeight} width={graphWidth}>
              {/* Axes */}
              <G>
                <Polyline points={`${padding},${graphHeight-padding} ${graphWidth-padding},${graphHeight-padding}`} stroke="#bbb" strokeWidth="2" />
                <Polyline points={`${padding},${padding} ${padding},${graphHeight-padding}`} stroke="#bbb" strokeWidth="2" />
              </G>
              {/* Calories - Red */}
              <Polyline points={getPoints('totalCalories')} stroke="#FF6F61" strokeWidth="3" fill="none" />
              {/* Protein - Green */}
              <Polyline points={getPoints('totalProtein')} stroke="#4E944F" strokeWidth="3" fill="none" />
              {/* Carbs - Blue */}
              <Polyline points={getPoints('totalCarbs')} stroke="#2196F3" strokeWidth="3" fill="none" />
              {/* Fats - Yellow */}
              <Polyline points={getPoints('totalFats')} stroke="#FFC107" strokeWidth="3" fill="none" />
              {/* Day labels */}
              {summary.map((d, i) => {
                // map index to Mon..Sun labels; assume summary[0] is earliest (Mon)
                const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
                const label = labels[i] || `Day ${i+1}`;
                return (
                  <SvgText
                    key={i}
                    x={padding + (i * (graphWidth - 2 * padding) / (days - 1))}
                    y={graphHeight - padding + 18}
                    fontSize="12"
                    fill="#888"
                    textAnchor="middle"
                  >{label}</SvgText>
                );
              })}
            </Svg>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot,{backgroundColor:'#FF6F61'}]} /><Text style={styles.legendLabel}>Calories</Text>
              <View style={[styles.legendDot,{backgroundColor:'#4E944F'}]} /><Text style={styles.legendLabel}>Protein</Text>
              <View style={[styles.legendDot,{backgroundColor:'#2196F3'}]} /><Text style={styles.legendLabel}>Carbs</Text>
              <View style={[styles.legendDot,{backgroundColor:'#FFC107'}]} /><Text style={styles.legendLabel}>Fats</Text>
            </View>
          </View>
          {/* ...no daily breakdown cards... */}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  subtitle: {
    fontSize: 16,
    color: '#888',
    alignSelf: 'center',
    marginBottom: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  mealCount: {
    fontSize: 16,
    color: '#0e4f11ff',
    fontWeight: '600',
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingVertical: 2,
  },
  nutrientKey: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
  },
  nutrientValue: {
    fontSize: 15,
    color: '#222',
    fontWeight: 'bold',
  },
  totalsCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  totalsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0e4f11ff',
    marginBottom: 8,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  totalsKey: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  totalsValue: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold',
  },
  graphBox: {
    width: '100%',
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    paddingVertical: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    gap: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  legendLabel: {
    fontSize: 13,
    color: '#888',
    marginRight: 10,
  },
});
