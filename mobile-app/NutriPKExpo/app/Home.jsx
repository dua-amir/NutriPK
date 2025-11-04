import React, { useEffect, useState, useRef } from "react";
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
            isSmall && { padding: 16 },
            { opacity: heroAnim, transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] },
          ]}
        >
          <View>
            <Text style={styles.greetingLarge}>Good day</Text>
            <Text style={styles.greetingName}>{username || 'User'}</Text>
            <Text style={styles.heroSub}>Today — at a glance</Text>
          </View>

          <View style={styles.avatarWrap}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarInitial}>{(username || "U")[0].toUpperCase()}</Text>
            </View>
          </View>
        </Animated.View>

        {/* overlapping cards container */}
        <View style={styles.overlapRow} pointerEvents="box-none">
          <View style={[styles.cardsRow, isSmall && { flexDirection: 'column' }]}>
            <Animated.View style={[styles.card, styles.shadow, { transform: [{ translateY: cardsAnim }] }]}>
              <View style={styles.cardHeaderTop}>
                <Text style={styles.cardTitle}>Water Intake</Text>
                <Text style={styles.cardSmall}>{waterCount} / 8</Text>
              </View>

              <View style={{ height: 14 }} />

              <View style={styles.progressBarTrack}>
                <Animated.View style={[styles.progressBarFill, { width: waterAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
              </View>

              <View style={styles.cardControlRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity activeOpacity={0.85} onPress={decWater} style={[styles.smallButton]}>
                    <Text style={styles.smallButtonText}>−</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.85} onPress={incWater} style={[styles.addButton, { marginLeft: 10 }]}>
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.encourage}>Goal: 8 glasses</Text>
              </View>
            </Animated.View>

            <Animated.View style={[styles.card, styles.shadow, { transform: [{ translateY: cardsAnim }] }]}>
              <View style={styles.cardHeaderTop}>
                <Text style={styles.cardTitle}>Calories</Text>
                <Text style={styles.cardSmall}>{caloriesConsumed} kcal</Text>
              </View>

              <View style={{ height: 12 }} />

              <View style={styles.calWrap}>
                <CircularProgress size={110} percentage={caloriesPercent} animatedValue={calAnim} />
                <View style={{ marginLeft: 14 }}>
                  <Text style={styles.percentText}>{caloriesPercent}%</Text>
                  <Text style={styles.smallMuted}>of {targetCalories} kcal</Text>
                  <View style={{ height: 8 }} />
                  <Text style={styles.encourage}>Keep it balanced</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </View>

        <View style={[styles.motivationRow, styles.shadow]}>
          <Text style={styles.motivationTextInline}>"{randomQuote()}"</Text>
        </View>

        <View style={[styles.recentMealsWrap, styles.shadow]}>
          <Text style={styles.sectionTitle}>Recent Meals</Text>
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
                            <Image source={{ uri: m.image }} style={styles.mealImage} />
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
                  <Text style={styles.mealTime}>{formatTime(m.time)}</Text>
                </Animated.View>
              );
            })
          )}
          
          {/* small CTA to view all */}
          <TouchableOpacity style={styles.viewAllBtn} activeOpacity={0.85} onPress={() => { if (navigation && navigation.navigate) navigation.navigate('SavedMeals'); else console.log('View all meals'); }}>
            <Text style={styles.viewAllText}>View all meals</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by NutriPK</Text>
        </View>

        {Platform.OS === "web" ? <style>{webStyle}</style> : null}
      </ScrollView>
    </View>
  );
}

function CircularProgress({ size = 120, percentage = 0, animatedValue }) {
  const rightRotate = animatedValue.interpolate({ inputRange: [0, 50], outputRange: ["0deg", "180deg"], extrapolate: "clamp" });
  const leftRotate = animatedValue.interpolate({ inputRange: [50, 100], outputRange: ["0deg", "180deg"], extrapolate: "clamp" });

  // color interpolation - restore green health accent
  const color = animatedValue.interpolate ? animatedValue.interpolate({ inputRange: [0, 100], outputRange: ["#34D399", "#10B981"] }) : "#10B981";

  const halfContainer = { position: "absolute", width: size / 2, height: size, overflow: "hidden" };
  const halfCircleBase = { position: "absolute", width: size, height: size, borderRadius: size / 2, top: 0, left: 0 };

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", overflow: "hidden" }}>
      <View style={[halfContainer, { left: size / 2 }]}>
        <Animated.View style={[halfCircleBase, { left: -size / 2, transform: [{ rotate: rightRotate }], backgroundColor: color }]} />
      </View>
      <View style={[halfContainer, { left: 0 }]}>
        <Animated.View style={[halfCircleBase, { left: 0, transform: [{ rotate: leftRotate }], backgroundColor: color }]} />
      </View>

      <View style={[styles.innerDonut, { width: size * 0.72, height: size * 0.72, borderRadius: (size * 0.72) / 2 }]}>
        <Text style={[styles.donutText, { fontSize: 22 }]}>{percentage}%</Text>
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

function formatTime(t) {
  try {
    if (!t) return '';
    const d = typeof t === 'number' ? new Date(t) : new Date(t);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: "#FFFFFF" },
  inner: { paddingVertical: 28, paddingHorizontal: 18, alignItems: "stretch", width: '100%' },
  shadow: { shadowColor: "#0B1220", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  header: { width: "100%", maxWidth: 980, borderRadius: 14, padding: 20, marginBottom: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FBFBFD" },
  greetingLarge: { fontSize: 13, color: '#8A96A2', marginBottom: 4 },
  greetingName: { fontSize: 22, fontWeight: '900', color: '#0B1220', marginBottom: 2 },
  heroSub: { color: "#7F8B95", fontSize: 13 },
  avatarWrap: { marginLeft: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#EAF7F3", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: '#E6F4EF' },
  avatarLarge: { width: 56, height: 56, borderRadius: 14, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", borderWidth: 0 },
  avatarInitial: { fontWeight: "700", fontSize: 16, color: "#374151" },
  cardsRow: { width: "100%", maxWidth: 980, flexDirection: "row", justifyContent: "space-between", gap: 16, marginBottom: 18 },
  card: { flex: 1, minWidth: 260, backgroundColor: "#FFFFFF", borderRadius: 14, padding: 20, marginBottom: 14, borderWidth: 0 },
  cardHeaderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  cardSmall: { fontSize: 13, color: "#6B7280" },
  progressBarTrack: { width: "100%", height: 10, backgroundColor: "#F1FAF6", borderRadius: 10, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#10B981", borderRadius: 10 },
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
  recentMealsWrap: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 8, padding: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0B1220', marginBottom: 8 },
  muted: { color: '#94A3B8', fontSize: 12 },
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