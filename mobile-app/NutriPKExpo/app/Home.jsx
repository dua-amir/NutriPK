import React, { useEffect, useState, useRef } from "react";
import { formatTimePK, formatHeaderDatePK } from './utils/dateUtils';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Platform,
  ScrollView,
  Image,
  Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, Entypo } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';


export default function Home({ navigation }) {
  const [username, setUsername] = useState("");
  const [waterCount, setWaterCount] = useState(0);
  const [caloriesConsumed] = useState(1350);
  const [targetCalories] = useState(1800);
  const [recentMeals, setRecentMeals] = useState([]);
  const [recentMealsLoading, setRecentMealsLoading] = useState(true);
  const [swipeAnims, setSwipeAnims] = useState([]);

  const { width } = useWindowDimensions();
  const isSmall = width < 700;

  // animations
  const heroAnim = useRef(new Animated.Value(0)).current; // opacity/translate
  const waterAnim = useRef(new Animated.Value(0)).current; // 0..1
  const calAnim = useRef(new Animated.Value(0)).current; // 0..100
  const cardsAnim = useRef(new Animated.Value(12)).current; // for entry translate

  useEffect(() => {
    const getUser = async () => {
      try {
        const email = await AsyncStorage.getItem("email");
        setUsername(email || "User");
      } catch {
        setUsername("User");
      }
    };
    getUser();

    Animated.timing(heroAnim, { toValue: 1, duration: 650, useNativeDriver: true }).start();

    const pct = Math.round((caloriesConsumed / targetCalories) * 100);
    Animated.timing(calAnim, { toValue: pct, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, []);

  // greeting based on Asia/Karachi timezone
  const [greeting, setGreeting] = useState('');
  useEffect(() => {
    try {
      const nowPK = new Date();
      // reuse formatTimePK to compute hour in PK time
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', hour: 'numeric', hour12: false }).formatToParts(nowPK);
      const hourPart = parts.find(p => p.type === 'hour');
      const hour = hourPart ? parseInt(hourPart.value, 10) : new Date().getUTCHours() + 5;
      if (hour >= 5 && hour < 12) setGreeting('Good Morning');
      else if (hour >= 12 && hour < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    } catch (e) {
      const localHour = new Date().getHours();
      if (localHour >= 5 && localHour < 12) setGreeting('Good Morning');
      else if (localHour >= 12 && localHour < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    }
  }, []);

  // load recent meals (if any) from AsyncStorage; expect an array stored under 'meals'
  useEffect(() => {
    const loadMeals = async () => {
      setRecentMealsLoading(true);
      try {
        const raw = await AsyncStorage.getItem('meals');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const list = parsed.slice(-3).reverse(); // latest first, up to 3
            setRecentMeals(list);
            // initialize subtle swipe anims for each meal
            setSwipeAnims(list.map(() => new Animated.Value(0)));
            setRecentMealsLoading(false);
            return;
          }
        }
      } catch (e) {
        // ignore parse errors
      }
      setRecentMeals([]);
      setSwipeAnims([]);
      setRecentMealsLoading(false);
    };
    loadMeals();
  }, []);

  // Backend base used to prefix relative static paths returned by backend
  const BACKEND_BASE = 'http://192.168.1.8:8000';

  function resolveMealImage(img) {
    if (!img) return null;
    const s = String(img).trim();
    if (s.startsWith('/')) return BACKEND_BASE + s;
    return s;
  }

  useEffect(() => {
    Animated.timing(waterAnim, { toValue: Math.min(1, waterCount / 8), duration: 450, useNativeDriver: false }).start();
  }, [waterCount]);

  useEffect(() => {
    // animate cards into view after hero
    Animated.timing(cardsAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start();
  }, []);

  const incWater = () => setWaterCount((c) => Math.min(8, c + 1));
  const decWater = () => setWaterCount((c) => Math.max(0, c - 1));

  const caloriesPercent = Math.min(100, Math.round((caloriesConsumed / targetCalories) * 100));

  // inject web CSS (font + hover effects) via style tag rendered below
  useEffect(() => {
    if (Platform.OS === "web") {
      const id = "poppins-link";
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap";
        document.head.appendChild(link);
      }
    }
  }, []);

  return (
    <View style={styles.outer}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.header,
            styles.shadow,
            isSmall && { padding: 12 },
            { opacity: heroAnim, transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] },
          ]}
        >
          {/* avatar left (matching image) */}
          <View style={styles.avatarWrapLeft}>
            <View style={styles.avatarCircleLeft}>
              {getProfileImageSource(username) ? (
                <Image source={getProfileImageSource(username)} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitialLeft}>{(username || 'U').charAt(0).toUpperCase()}</Text>
              )}
            </View>
          </View>

          {/* center date and greeting */}
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.dateSmall}>{formatHeaderDate()}</Text>
            <Text style={styles.greetingNameCenter}>{greeting} 🌤️</Text>
            <Text style={styles.heroSubSmall}>You've gained 2kg yesterday keep it up!</Text>
          </View>

          {/* calendar icon top-right */}
          <TouchableOpacity style={styles.calendarBtn} activeOpacity={0.85} onPress={() => console.log('Open calendar')}>
            <MaterialIcons name="calendar-today" size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Big Calories card (screenshot) */}
        <View style={[styles.caloriesCardWrap, styles.shadow]}>
          <Animated.View style={[styles.caloriesCard, { transform: [{ translateY: cardsAnim }], opacity: heroAnim, paddingVertical: 26 }]}>
              <View style={{ alignItems: 'center' }}>
              <Text style={styles.caloriesLabel}>Calories</Text>
              <View style={{ height: 14 }} />
              <View style={styles.caloriesInnerPanel}>
                <CircularProgress size={150} percentage={caloriesPercent} animatedValue={calAnim} strokeWidth={14} />
              </View>
              <View style={{ height: 12 }} />
              <Text style={styles.caloriesBig}>{caloriesConsumed}</Text>
              <Text style={styles.caloriesSmall}>of {targetCalories} kcal</Text>
            </View>
          </Animated.View>
        </View>

        {/* small nutrient stats row */}
        <View style={styles.statRow}>
          <View style={[styles.statCard, styles.shadow]}>
            <Text style={styles.statValue}>134g</Text>
            <Text style={styles.statLabel}>Total carbs</Text>
          </View>
          <View style={[styles.statCard, styles.shadow]}>
            <Text style={styles.statValue}>94g</Text>
            <Text style={styles.statLabel}>Total fat</Text>
          </View>
        </View>

        <View style={[styles.motivationRow, styles.shadow]}>
          <Text style={styles.motivationTextInline}>"{randomQuote()}"</Text>
        </View>

        {/* Today's Meals section (below calories) */}
        <View style={[styles.recentMealsWrap, styles.shadow]}>
          <Text style={styles.sectionTitle}>Today's Meal</Text>
            {recentMealsLoading ? (
            // simple skeleton placeholders
            [0,1,2].map((i) => (
              <View key={i} style={{paddingVertical:10}}>
                <View style={{height:12, backgroundColor:'#F1F5F9', borderRadius:6, marginBottom:8, width: '60%'}} />
                <View style={{height:10, backgroundColor:'#F1F5F9', borderRadius:6, width: '30%'}} />
              </View>
            ))
          ) : recentMeals.length === 0 ? (
            <View style={{alignItems:'center', paddingVertical:12}}>
              <Text style={styles.muted}>No meals logged yet.</Text>
              <AnimatedButton style={styles.addMealButton} onPress={() => { if (navigation && navigation.navigate) navigation.navigate('AddMeal'); else console.log('Add meal'); }}>
                <Text style={styles.addMealText}>Add your first meal</Text>
              </AnimatedButton>
            </View>
          ) : (
            recentMeals.map((m, idx) => {
              const translateX = swipeAnims[idx] || new Animated.Value(0);
              return (
                <Animated.View key={idx} style={[styles.mealRow, { transform: [{ translateX }] }] }>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      if (navigation && navigation.navigate) navigation.navigate('MealDetail', { meal: m });
                      else console.log('Open meal', m);
                    }}
                    onPressIn={() => Animated.timing(translateX, { toValue: -8, duration: 120, useNativeDriver: true }).start()}
                    onPressOut={() => Animated.timing(translateX, { toValue: 0, duration: 220, useNativeDriver: true }).start()}
                    style={{ flex: 1 }}
                  >
                    <View style={styles.mealLeft}>
                        <View style={styles.mealTopRow}>
                          {m.image ? (
                            <Image source={{ uri: resolveMealImage(m.image) }} style={styles.mealImage} />
                          ) : (
                            <View style={styles.mealAvatar}><Text style={styles.mealAvatarText}>{(m.name||'M').charAt(0).toUpperCase()}</Text></View>
                          )}
                          <View style={{flex:1}}>
                            <Text style={styles.mealTitle}>{m.name || 'Meal'}</Text>
                            <Text style={styles.mealSubtitle}>{m.calories ? `${m.calories} kcal` : m.description || ''}</Text>
                          </View>
                        </View>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.mealRight}>
                    <Text style={styles.mealTime}>{formatTime(m.time)}</Text>
                    <Entypo name="chevron-right" size={18} color="#9CA3AF" />
                  </View>
                </Animated.View>
              );
            })
          )}

          <TouchableOpacity style={styles.viewAllBtn} activeOpacity={0.85} onPress={() => { if (navigation && navigation.navigate) navigation.navigate('SavedMeals'); else console.log('View all meals'); }}>
            <Text style={styles.viewAllText}>View all meals</Text>
          </TouchableOpacity>
        </View>

        {/* Water visual (bottom) */}
        <View style={[styles.waterVisualWrap, styles.shadow]}>
          <View style={styles.waterVisualCard}>
            <View style={styles.waterVisualTopRow}>
              <Text style={styles.waterLabel}>Water</Text>
              <TouchableOpacity style={styles.viewMoreDots}><Text style={{color:'#fff'}}>•••</Text></TouchableOpacity>
            </View>
            <View style={styles.waterGlassesRow}>
              {/* approximate glass icons as simple shapes */}
              {[0,1,2,3,4,5,6,7].map((g,i)=> (
                <View key={i} style={[styles.glass, i < waterCount ? styles.glassFilled : styles.glassEmpty]} />
              ))}
            </View>
            <View style={styles.waterFooterRow}>
              <Text style={styles.waterFooterText}>{waterCount * 250} / 2000ml</Text>
              <Text style={styles.waterFooterText}>{Math.round((waterCount/8)*100)}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by NutriPK</Text>
        </View>

        {Platform.OS === "web" ? <style>{webStyle}</style> : null}
      </ScrollView>
    </View>
  );
}

function CircularProgress({ size = 120, percentage = 0, animatedValue, strokeWidth = 12 }) {
  // SVG based circular progress for more accurate arc and gradient
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (circumference * progress) / 100;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#7AE582" stopOpacity="1" />
            <Stop offset="100%" stopColor="#10B981" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <G rotation="-90" origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#E6F9EE"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="url(#grad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            fill="none"
          />
        </G>
      </Svg>

      <View style={[styles.innerDonut, { width: size * 0.66, height: size * 0.66, borderRadius: (size * 0.66) / 2 }]}>
        <Text style={[styles.donutText, { fontSize: 20, textAlign: 'center' }]}>{percentage}%</Text>
      </View>
    </View>
  );
}

// small animated button that scales on press for micro-interaction
function AnimatedButton({ children, onPress, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={style}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

function randomQuote() {
  const quotes = [
    "Consistency creates change 💚",
    "Small habits, big results 🌱",
    "Fuel your body, honor your goals ✨",
    "Progress is progress — keep going 💪",
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

function formatTime(t) { return formatTimePK(t); }
function formatHeaderDate() { return formatHeaderDatePK(); }

function getProfileImageSource(username) {
  // try to return a placeholder image or initials fallback
  // Using a data url with initials is complex; return null so Image will be empty and avatar initial will show
  return null;
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: "#FFFFFF" },
  inner: { paddingVertical: 28, paddingHorizontal: 18, alignItems: "stretch", width: '100%' },
  shadow: { shadowColor: "#0B1220", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  header: { width: "100%", maxWidth: 980, borderRadius: 14, padding: 20, marginBottom: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FBFBFD" },
  greetingLarge: { fontSize: 13, color: '#8A96A2', marginBottom: 4 },
  greetingName: { fontSize: 18, fontWeight: '800', color: '#07112A', marginBottom: 2, textAlign: 'center' },
  heroSub: { color: "#7F8B95", fontSize: 13 },
  dateSmall: { fontSize: 12, color: '#6B7280', fontWeight: '700' },
  greetingNameCenter: { fontSize: 16, fontWeight: '800', color: '#0B1220' },
  avatarWrapLeft: { marginRight: 12, alignItems: 'flex-start' },
  avatarCircleLeft: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', borderWidth: 0 },
  avatarImg: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F1F5F9' },
  avatarInitialLeft: { fontSize: 14, fontWeight: '800', color: '#374151' },
  calendarBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 16, fontWeight: '800', color: '#065F46' },
  cardsRow: { width: "100%", maxWidth: 980, flexDirection: "row", justifyContent: "space-between", gap: 16, marginBottom: 18 },
  card: { flex: 1, minWidth: 260, backgroundColor: "#FFFFFF", borderRadius: 14, padding: 20, marginBottom: 14, borderWidth: 0 },
  cardHeaderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  cardSmall: { fontSize: 13, color: "#6B7280" },
  progressBarTrack: { width: "100%", height: 10, backgroundColor: "#F1FAF6", borderRadius: 10, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#10B981", borderRadius: 10 },
  topCardWrap: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 12 },
  waterCard: { width: '100%', backgroundColor: '#ECFDF6', borderRadius: 12, padding: 18, marginBottom: 8, color: '#fff' },
  progressBarTrackLarge: { width: '100%', height: 18, backgroundColor: '#E6FFF2', borderRadius: 12, overflow: 'hidden' },
  progressBarFillLarge: { height: '100%', backgroundColor: '#065F46', borderRadius: 12 },
  cardTitleWhite: { color: '#ffffff' },
  cardSmallWhite: { color: '#E6FFF2' },
  cardControlRow: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: 'space-between' },
  addButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center", marginRight: 8, borderWidth: 1, borderColor: '#EEF2F6' },
  addButtonText: { fontSize: 20, color: "#374151", fontWeight: "700" },
  smallButton: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEF2F6' },
  smallButtonText: { fontSize: 18, color: '#374151', fontWeight: '700' },
  encourage: { color: "#6B7280", fontSize: 12 },
  calWrap: { flexDirection: "row", alignItems: "center" },
  percentText: { fontSize: 22, fontWeight: "900", color: "#07112A" },
  smallMuted: { color: "#94A3B8", fontSize: 12 },
  innerDonut: { position: "absolute", alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", borderRadius: 999 },
  donutText: { fontWeight: "900", fontSize: 20, color: "#07112A" },
  motivationRow: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 12, alignItems: 'center' },
  motivationTextInline: { color: '#374151', fontSize: 13 },
  heroSubSmall: { color: '#94A3B8', fontSize: 12, marginTop: 6 },
  recentMealsWrap: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 8, padding: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0B1220', marginBottom: 8 },
  muted: { color: '#94A3B8', fontSize: 12 },
  caloriesCardWrap: { width: '100%', paddingHorizontal: 0, marginBottom: 12 },
  caloriesCard: { width: '100%', backgroundColor: '#F0FDF4', borderRadius: 14, padding: 18, alignItems: 'center' },
  caloriesInnerPanel: { width: 180, height: 120, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#0B1220', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  caloriesLabel: { color: '#065F46', fontWeight: '700', fontSize: 14 },
  caloriesBig: { fontSize: 42, fontWeight: '900', color: '#07112A' },
  caloriesSmall: { color: '#94A3B8', fontSize: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#07112A' },
  statLabel: { fontSize: 12, color: '#94A3B8', marginTop: 6 },
  waterVisualWrap: { width: '100%', marginTop: 12, marginBottom: 28 },
  waterVisualCard: { backgroundColor: '#06B58F', borderRadius: 14, padding: 16 },
  waterVisualTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  waterLabel: { color: '#fff', fontWeight: '800' },
  viewMoreDots: { backgroundColor: '#0A8A6A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  waterGlassesRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  glass: { width: 30, height: 36, borderRadius: 6, marginHorizontal: 4 },
  glassFilled: { backgroundColor: '#fff' },
  glassEmpty: { backgroundColor: 'rgba(255,255,255,0.18)' },
  waterFooterRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  waterFooterText: { color: '#E6FFF2', fontWeight: '700' },
  mealRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F7F9FB' },
  mealLeft: { flex: 1, paddingRight: 8 },
  mealTopRow: { flexDirection: 'row', alignItems: 'center' },
  mealAvatar: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#F7FAFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  mealAvatarText: { fontSize: 13, fontWeight: '700', color: '#0B1220' },
  mealImage: { width: 44, height: 44, borderRadius: 8, marginRight: 12, backgroundColor: '#EFEFF0' },
  mealTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  mealSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  mealTime: { fontSize: 12, color: '#94A3B8' },
  footer: { paddingVertical: 16, alignItems: "center", width: "100%" },
  footerText: { color: "#A1A9B1", fontSize: 12 },
  overlapRow: { marginTop: -20, marginBottom: 6, paddingHorizontal: 2 },
  addMealButton: { marginTop: 12, backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  addMealText: { color: '#fff', fontWeight: '800' },
  viewAllBtn: { marginTop: 12, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 14 },
  viewAllText: { color: '#FF6B5C', fontWeight: '700' },
});

/* Web CSS injected into a <style> tag (keeps file standalone) */
const webStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');
  body, #root { font-family: 'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background: #FAFAFA; }
  .heroCard { background: linear-gradient(90deg, rgba(77,182,172,0.12) 0%, rgba(255,249,240,0.6) 100%); }
  .card { transition: transform .28s ease, box-shadow .28s ease; }
  .card:hover { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(0,0,0,0.06); }
  .motivationCard { background: linear-gradient(90deg, rgba(255,245,240,0.8), rgba(245,255,250,0.85)); transition: box-shadow .28s ease, transform .28s ease; }
  .motivationCard:hover { box-shadow: 0 14px 30px rgba(77,182,172,0.08); transform: translateY(-4px); }
  .footer { box-shadow: 0 -6px 20px rgba(0,0,0,0.02); }
  .addButton { cursor: pointer; transition: transform .18s ease, box-shadow .18s ease; }
  .addButton:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(255,145,77,0.12); }
  @media (max-width: 700px) { .cardsRow { flex-direction: column !important; gap: 12px !important; } .heroCard { padding: 16px !important; } }
`;