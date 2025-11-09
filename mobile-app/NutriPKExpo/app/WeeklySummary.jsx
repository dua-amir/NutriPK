import React, { useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { parseToDateObj, formatDatePK } from './utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscribe } from './utils/events';
import Svg, { Polyline, G, Text as SvgText, Rect, Circle as SvgCircle, Line } from 'react-native-svg';
import { BACKEND_BASE } from './config';

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
      const response = await fetch(`${BACKEND_BASE}/api/user/weekly-summary?email=${encodeURIComponent(email)}`);
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
    // subscribe to updates when water is changed elsewhere
    const unsub = subscribe('weeklyUpdated', () => fetchSummary());
    return () => unsub();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchSummary();
    }, [])
  );

  // Prepare graph data
  const graphHeight = 140;
  const graphWidth = 320;
  const padding = 36; // left/right padding for y labels
  const days = summary.length;
  // reorder summary to Mon..Sun based on backend day labels (which look like 'Mon 03 Nov')
  const order = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const summaryByAbb = {};
  summary.forEach(d => {
    const abb = (d.day || '').split(' ')[0];
    if (abb) summaryByAbb[abb] = d;
  });
  const orderedSummary = order.map(abb => summaryByAbb[abb] || { day: `${abb}`, count:0, totalCalories:0, totalProtein:0, totalCarbs:0, totalFats:0, waterGlasses:0 });
  if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[DEV] orderedSummary', orderedSummary.map(d=>({day:d.day,water:d.waterGlasses})));
  // Get max for scaling
  const maxCal = Math.max(...orderedSummary.map(d => d.totalCalories), 1);
  const maxMacro = Math.max(...orderedSummary.map(d => Math.max(d.totalProtein, d.totalCarbs, d.totalFats)), 1);
  // Helper to get polyline points
  const getPointsCal = (key) => {
    return orderedSummary.map((d, i) => {
      const x = padding + (i * (graphWidth - 2 * padding) / (order.length - 1));
      const y = graphHeight - padding - ((d[key] / maxCal) * (graphHeight - 2 * padding));
      return `${x},${y}`;
    }).join(' ');
  };
  const getPointsMacro = (key) => {
    return orderedSummary.map((d, i) => {
      const x = padding + (i * (graphWidth - 2 * padding) / (order.length - 1));
      const y = graphHeight - padding - ((d[key] / maxMacro) * (graphHeight - 2 * padding));
      return `${x},${y}`;
    }).join(' ');
  };
  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom:40}}>
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
          <View style={[styles.graphBox, {backgroundColor: '#fff', paddingVertical: 14}]}> 
            <Text style={{fontSize:16, fontWeight:'700', color:'#0e4f11ff', alignSelf:'flex-start', marginLeft:12, marginBottom:6}}>Nutrients Trend</Text>
            <Svg height={graphHeight} width={graphWidth}>
              {/* Axes */}
              <G>
                <Polyline points={`${padding},${graphHeight-padding} ${graphWidth-padding},${graphHeight-padding}`} stroke="#bbb" strokeWidth="2" />
                <Polyline points={`${padding},${padding} ${padding},${graphHeight-padding}`} stroke="#bbb" strokeWidth="2" />
              </G>
              {/* Gridlines + Y labels */}
              {/* Calorie gridlines + left labels (calories scale) */}
              {Array.from({length:4}).map((_,gi)=>{
                const gy = padding + gi * ((graphHeight - 2*padding)/3);
                const val = Math.round(maxCal * (1 - (gi/3)));
                return (
                  <G key={'g'+gi}>
                    <Line x1={padding} y1={gy} x2={graphWidth - padding} y2={gy} stroke="#F1F5F9" strokeWidth="1" />
                    <SvgText x={padding - 8} y={gy+4} fontSize="10" fill="#9CA3AF" textAnchor="end">{val}</SvgText>
                  </G>
                );
              })}
              {/* Calories - Red (left scale) */}
              <Polyline points={getPointsCal('totalCalories')} stroke="#FF6F61" strokeWidth="3" fill="none" />
              {orderedSummary.map((d,i)=>{ const pts = getPointsCal('totalCalories').split(' '); const coords = pts[i]?.split(','); if(!coords) return null; return <SvgCircle key={'cC'+i} cx={coords[0]} cy={coords[1]} r={3} fill="#FF6F61" /> })}
              {/* Protein - Green (right macro scale) */}
              <Polyline points={getPointsMacro('totalProtein')} stroke="#4E944F" strokeWidth="3" fill="none" />
              {orderedSummary.map((d,i)=>{ const pts = getPointsMacro('totalProtein').split(' '); const coords = pts[i]?.split(','); if(!coords) return null; return <SvgCircle key={'cP'+i} cx={coords[0]} cy={coords[1]} r={3} fill="#4E944F" /> })}
              {/* Carbs - Blue (right macro scale) */}
              <Polyline points={getPointsMacro('totalCarbs')} stroke="#2196F3" strokeWidth="3" fill="none" />
              {orderedSummary.map((d,i)=>{ const pts = getPointsMacro('totalCarbs').split(' '); const coords = pts[i]?.split(','); if(!coords) return null; return <SvgCircle key={'cB'+i} cx={coords[0]} cy={coords[1]} r={3} fill="#2196F3" /> })}
              {/* Fats - Yellow (right macro scale) */}
              <Polyline points={getPointsMacro('totalFats')} stroke="#FFC107" strokeWidth="3" fill="none" />
              {orderedSummary.map((d,i)=>{ const pts = getPointsMacro('totalFats').split(' '); const coords = pts[i]?.split(','); if(!coords) return null; return <SvgCircle key={'cF'+i} cx={coords[0]} cy={coords[1]} r={3} fill="#FFC107" /> })}
              {/* Right-side macro labels (three ticks) */}
              { [maxMacro, Math.round(maxMacro/2), 0].map((v, idx) => {
                const y = graphHeight - padding - ((v / maxMacro) * (graphHeight - 2 * padding));
                return <SvgText key={'r'+idx} x={graphWidth - padding + 28} y={y+4} fontSize="10" fill="#9CA3AF" textAnchor="end">{v}</SvgText>;
              })}
              {/* Day labels - use backend provided 'day' label (Mon DD MMM) so ordering matches */}
              {orderedSummary.map((d, i) => {
                const label = (d.day || '').split(' ')[0] || `D${i+1}`;
                return (
                  <SvgText
                    key={i}
                    x={padding + (i * (graphWidth - 2 * padding) / (order.length - 1))}
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
            {/* Water intake graph */}
            <View style={[styles.card, {marginTop: 8}]}>
              <Text style={[styles.totalsTitle, {fontSize:18, marginBottom:8}]}>Water Intake (glasses/day)</Text>
              <Svg width={320} height={160}>
                {orderedSummary.map((d,i) => {
                  const label = (d.day || '').split(' ')[0];
                  const x = 24 + i * 40;
                  const max = 8;
                  const h = Math.round(((d.waterGlasses || 0) / max) * 90);
                  const yBase = 120;
                  const barWidth = 18;
                  const yTop = yBase - h;
                  return (
                    <React.Fragment key={i}>
                      {/* background rail */}
                      <Rect x={x - barWidth/2} y={yBase - 92} width={barWidth} height={92} rx={8} fill="#F1F5F9" />
                      {/* filled portion */}
                      <Rect x={x - barWidth/2} y={yTop} width={barWidth} height={h} rx={8} fill={d.waterGlasses ? '#06B58F' : '#CBD5E1'} />
                      <SvgText x={x} y={yTop - 8} fontSize="12" fill="#064E3B" textAnchor="middle">{d.waterGlasses || 0}</SvgText>
                      <SvgText x={x} y={yBase + 20} fontSize="10" fill="#6B7280" textAnchor="middle">{label}</SvgText>
                    </React.Fragment>
                  );
                })}
              </Svg>
            </View>
          {/* ...no daily breakdown cards... */}
        </>
      )}
    </ScrollView>
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
