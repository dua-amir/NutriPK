import React, { useEffect, useState, useRef } from "react";
import { formatTimePK, formatHeaderDatePK, addDaysISO, toISODate, parseToDateObj, toPKDate } from './utils/dateUtils';
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
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKEND_BASE } from './config';
import { MaterialIcons, Entypo, FontAwesome } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { useRouter } from 'expo-router';


export default function Home({ navigation }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [userEmail, setUserEmail] = useState(null);
  const [waterCount, setWaterCount] = useState(0);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [proteinConsumed, setProteinConsumed] = useState(0);
  const [carbsConsumed, setCarbsConsumed] = useState(0);
  const [fatsConsumed, setFatsConsumed] = useState(0);
  const [targetCalories, setTargetCalories] = useState(2000);
  const [targetProtein, setTargetProtein] = useState(75);
  const [targetCarbs, setTargetCarbs] = useState(275);
  const [targetFats, setTargetFats] = useState(70);
  const [recentMeals, setRecentMeals] = useState([]);
  const [recentMealsLoading, setRecentMealsLoading] = useState(true);
  const [swipeAnims, setSwipeAnims] = useState([]);
  // default selected date should be in Pakistan timezone (Asia/Karachi)
  const getPKIsoToday = () => {
    try {
      const pkStr = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Karachi' });
      const pkDate = new Date(pkStr);
      return toISODate(pkDate);
    } catch (e) { return toISODate(new Date()); }
  };
  const [selectedDate, setSelectedDate] = useState(getPKIsoToday());

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
        setUserEmail(email || null);
        // fetch public profile to get target calories
        if (email) {
          try {
            const res = await fetch(`${BACKEND_BASE}/api/user/profile-public?email=${encodeURIComponent(email)}`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.target_calories) setTargetCalories(Number(data.target_calories));
              if (data && data.target_protein) setTargetProtein(Number(data.target_protein));
              if (data && data.target_carbs) setTargetCarbs(Number(data.target_carbs));
              if (data && data.target_fats) setTargetFats(Number(data.target_fats));
            }
          } catch(e) {
            // ignore
          }
        }
      } catch {
        setUsername("User");
      }
    };
    getUser();

    Animated.timing(heroAnim, { toValue: 1, duration: 650, useNativeDriver: true }).start();

    const pct = Math.round((caloriesConsumed / Math.max(1, targetCalories)) * 100);
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

  // Recent meals are loaded per-selectedDate in the nutrients loader below.

  // Backend base used to prefix relative static paths returned by backend
  // imported from central config so it can be changed per laptop

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

  // persist water to backend when waterCount or selectedDate changes
  useEffect(() => {
    const persist = async () => {
      if (!userEmail) return;
      try {
        await fetch(`${BACKEND_BASE}/api/user/water`, {
          method: 'POST',
          body: new URLSearchParams({ email: userEmail, date: selectedDate, glasses: String(waterCount) }),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
      } catch (e) {
        // ignore
      }
    };
    persist();
  }, [waterCount, selectedDate, userEmail]);

  // load water for selected date
  useEffect(() => {
    const loadWater = async () => {
      if (!userEmail) return;
      try {
        const res = await fetch(`${BACKEND_BASE}/api/user/water?email=${encodeURIComponent(userEmail)}`);
        if (!res.ok) return;
        const data = await res.json();
        const doc = (data.water || []).find(w => w.date === selectedDate);
        setWaterCount(doc ? Number(doc.glasses || 0) : 0);
      } catch (e) {}
    };
    loadWater();
  }, [selectedDate, userEmail]);

  const addGlass = () => setWaterCount(c => Math.min(8, c + 1));
  const removeGlass = () => setWaterCount(c => Math.max(0, c - 1));

  const caloriesPercent = Math.min(100, Math.round((caloriesConsumed / targetCalories) * 100));

  // Helper to extract nutrients for debugging
  function extractNutrients(m) {
    const nutr = m.nutrients || {};
    const cal = Number(m.calories ?? nutr.calories ?? nutr.Calories ?? 0) || 0;
    const prot = Number(m.protein ?? nutr.protein ?? nutr.Protein ?? 0) || 0;
    const carb = Number(m.carbs ?? m.carbohydrates ?? nutr.carbs ?? nutr.carbohydrates ?? nutr.Carbs ?? 0) || 0;
    const fat = Number(m.fats ?? m.fat ?? nutr.fats ?? nutr.fat ?? nutr.Fat ?? 0) || 0;
    return { cal, prot, carb, fat };
  }

  // fetch today's calories and nutrients for selectedDate
  useEffect(() => {
    const loadNutrients = async () => {
      setRecentMealsLoading(true);
      try {
        const email = await AsyncStorage.getItem('email');
        if (!email) {
          setRecentMeals([]);
          return;
        }
        // fetch meals and compute calories/nutrients for selectedDate
        const res = await fetch(`${BACKEND_BASE}/api/user/meals?email=${encodeURIComponent(email)}`);
        if (!res.ok) {
          setRecentMeals([]);
          return;
        }
        const data = await res.json();
        const meals = data.meals || [];
        // Dev-only: log parsing results for each meal to help debug timezone/date issues
        try {
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            meals.forEach(m => {
              const tRaw = m.timestamp || m.time || m.created_at || m.ts;
              const dt = (tRaw instanceof Date) ? tRaw : parseToDateObj(tRaw) || new Date(tRaw);
              const pk = toPKDate(dt) || dt;
              const pkIso = toISODate(pk);
              const parsedIso = dt && dt.toISOString ? dt.toISOString() : String(dt);
              // eslint-disable-next-line no-console
              console.log('[DEV] meal parse ->', m._id || m.id || m.name || '<meal>', 'orig:', tRaw, 'parsedUTC:', parsedIso, 'pkIso:', pkIso);
            });
          }
        } catch (e) {
          // ignore dev logging errors
        }
        // filter by same day using ISO date (robust parsing) and aggregate nutrients
        const todays = meals.filter(m => {
          const tRaw = m.timestamp || m.time || m.created_at || m.ts;
          if (!tRaw) return false;
          const dt = (tRaw instanceof Date) ? tRaw : parseToDateObj(tRaw) || new Date(tRaw);
          if (!dt) return false;
          // Convert parsed timestamp to PK local date for correct day comparison
          const pkDate = toPKDate(dt) || dt;
          return toISODate(pkDate) === selectedDate;
        });
        let c = 0, p = 0, carbs = 0, fats = 0;
        todays.forEach(m => {
          const nutr = m.nutrients || {};
          // support both top-level and nested nutrient keys
          const cal = Number(m.calories ?? nutr.calories ?? nutr.Calories ?? 0) || 0;
          const prot = Number(m.protein ?? nutr.protein ?? nutr.Protein ?? 0) || 0;
          const carb = Number(m.carbs ?? m.carbohydrates ?? nutr.carbs ?? nutr.carbohydrates ?? nutr.Carbs ?? 0) || 0;
          const fat = Number(m.fats ?? m.fat ?? nutr.fats ?? nutr.fat ?? nutr.Fat ?? 0) || 0;
          c += cal;
          p += prot;
          carbs += carb;
          fats += fat;
        });
        setCaloriesConsumed(Math.round(c));
        setProteinConsumed(Math.round(p));
        setCarbsConsumed(Math.round(carbs));
        setFatsConsumed(Math.round(fats));
        setRecentMeals(todays);
      } catch (e) {
        // swallow errors but ensure UI updates below
      } finally {
        setRecentMealsLoading(false);
      }
    };
    loadNutrients();
  }, [selectedDate]);

  const showPrev = () => setSelectedDate(addDaysISO(selectedDate, -1));
  const showNext = () => setSelectedDate(addDaysISO(selectedDate, 1));

  const onBell = () => {
    const msg = "This feature isn't enabled yet. It will be available soon!";
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Coming soon', msg);
  };

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
          {/* left: profile */}
          <View style={styles.avatarWrapLeft}>
            <View style={styles.avatarCircleLeft}>
              {getProfileImageSource(username) ? (
                <Image source={getProfileImageSource(username)} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitialLeft}>{(username || 'U').charAt(0).toUpperCase()}</Text>
              )}
            </View>
          </View>

          {/* center: date with prev/next */}
          <View style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={showPrev} style={{ padding: 8 }}>
                <Entypo name="chevron-left" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={{ alignItems: 'center', paddingHorizontal: 8 }}>
                <Text style={styles.dateSmall}>{formatHeaderDate(selectedDate)}</Text>
                <Text style={styles.greetingNameCenter}>{formatHeaderDate(selectedDate)}</Text>
              </View>
              <TouchableOpacity onPress={showNext} style={{ padding: 8 }}>
                <Entypo name="chevron-right" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.heroSubSmall}>{greeting} - Stay consistent!</Text>
          </View>

          {/* right: bell */}
          <TouchableOpacity style={styles.calendarBtn} activeOpacity={0.85} onPress={onBell}>
            <FontAwesome name="bell" size={18} color="#0e4f11ff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Big Calories card*/}
        {/* Calories + Quote Card */}
        <View style={[styles.caloriesCardWrap, styles.shadow]}>
          <Animated.View style={[styles.caloriesCard, { transform: [{ translateY: cardsAnim }], opacity: heroAnim, paddingVertical: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.cardTitle, { marginBottom: 6 }]}>Today's Motivation</Text>
              <Text style={styles.motivationTextInline}>"{randomQuote()}"</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <CircularProgress size={120} percentage={caloriesPercent} animatedValue={calAnim} strokeWidth={12} centerLabel={`${caloriesConsumed} kcal`} />
              <View style={{ height: 8 }} />
              <Text style={styles.caloriesSmall}>{caloriesConsumed} / {targetCalories} kcal</Text>
            </View>
          </Animated.View>
        </View>


        {/* Macronutrients card */}
        <View style={styles.statRow}>
          <View style={[styles.statCard, styles.shadow]}>
            <Text style={styles.statLabel}>Protein</Text>
            <View style={{ height: 8 }} />
            <CircularProgress size={80} percentage={Math.min(100, Math.round((proteinConsumed / Math.max(1, targetProtein)) * 100))} strokeWidth={10} centerLabel={`${proteinConsumed}g`} />
            <Text style={styles.statValue}>{proteinConsumed}g</Text>
            <Text style={styles.smallMuted}>{Math.round((proteinConsumed / Math.max(1, targetProtein)) * 100)}% of {targetProtein}g</Text>
          </View>
          <View style={[styles.statCard, styles.shadow]}>
            <Text style={styles.statLabel}>Carbs</Text>
            <View style={{ height: 8 }} />
            <CircularProgress size={80} percentage={Math.min(100, Math.round((carbsConsumed / Math.max(1, targetCarbs)) * 100))} strokeWidth={10} centerLabel={`${carbsConsumed}g`} />
            <Text style={styles.statValue}>{carbsConsumed}g</Text>
            <Text style={styles.smallMuted}>{Math.round((carbsConsumed / Math.max(1, targetCarbs)) * 100)}% of {targetCarbs}g</Text>
          </View>
          <View style={[styles.statCard, styles.shadow]}>
            <Text style={styles.statLabel}>Fats</Text>
            <View style={{ height: 8 }} />
            <CircularProgress size={80} percentage={Math.min(100, Math.round((fatsConsumed / Math.max(1, targetFats)) * 100))} strokeWidth={10} centerLabel={`${fatsConsumed}g`} />
            <Text style={styles.statValue}>{fatsConsumed}g</Text>
            <Text style={styles.smallMuted}>{Math.round((fatsConsumed / Math.max(1, targetFats)) * 100)}% of {targetFats}g</Text>
          </View>
        </View>

        <View style={[styles.waterVisualWrap, styles.shadow]}>
          <View style={styles.waterVisualCard}>
            <View style={styles.waterVisualTopRow}>
              <Text style={styles.waterLabel}>Water</Text>
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <TouchableOpacity onPress={removeGlass} style={[styles.smallButton, {marginRight:8}]}><Text style={styles.smallButtonText}>-</Text></TouchableOpacity>
                <TouchableOpacity onPress={addGlass} style={styles.addButton}><Text style={styles.addButtonText}>+</Text></TouchableOpacity>
              </View>
            </View>
            <View style={styles.waterGlassesRow}>
              {[0,1,2,3,4,5,6,7].map((g,i)=> (
                <TouchableOpacity key={i} onPress={() => setWaterCount(i+1)} style={[styles.glass, i < waterCount ? styles.glassFilled : styles.glassEmpty]} />
              ))}
            </View>
            <View style={styles.waterFooterRow}>
              <Text style={styles.waterFooterText}>{waterCount * 250} / 2000ml</Text>
              <Text style={styles.waterFooterText}>{Math.round((waterCount/8)*100)}%</Text>
            </View>
            <Text style={{color:'#E6FFF2', marginTop:8}}>1 glass ≈ 250 ml</Text>
          </View>
        </View>

        {/* Today's Meals section (below water + calories) */}
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
                <AnimatedButton style={styles.addMealButton} onPress={() => { try { router.push({ pathname: '/tabs/Camera' }); } catch(e) { console.log('Open camera fallback', e); } }}>
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
                      try {
                        router.push({ pathname: '/MealDetails', params: { meal: JSON.stringify(m) } });
                      } catch (e) {
                        console.log('Open meal fallback', e, m);
                      }
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
                    <Text style={styles.mealTime}>{formatTime(m.timestamp || m.time)}</Text>
                    <TouchableOpacity onPress={() => { if (navigation && navigation.navigate) navigation.navigate('MealDetails', { meal: JSON.stringify(m) }); }}>
                      <Entypo name="chevron-right" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              );
            })
          )}

        </View>
        
        {Platform.OS === "web" ? <style>{webStyle}</style> : null}
      </ScrollView>
    </View>
  );
}

function CircularProgress({ size = 120, percentage = 0, animatedValue, strokeWidth = 12, centerLabel = null }) {
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
        {centerLabel ? (
          <Text style={[styles.donutText, { fontSize: 16, textAlign: 'center' }]}>{centerLabel}</Text>
        ) : (
          <Text style={[styles.donutText, { fontSize: 20, textAlign: 'center' }]}>{percentage}%</Text>
        )}
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
    "Consistency isn’t about perfection; it’s about showing up every day and trusting the process 💚",
    "Small daily habits shape big, lasting transformations; one mindful choice at a time 🌱",
    "Fuel your body with intention, and let every meal be a step toward your stronger self ✨",
    "Every bit of progress counts, keep pushing forward, your goals are closer than you think 💪",
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

function formatTime(t) { return formatTimePK(t); }
function formatHeaderDate(d) { return formatHeaderDatePK(d); }

function getProfileImageSource(username) {
  // try to return a placeholder image or initials fallback
  // Using a data url with initials is complex; return null so Image will be empty and avatar initial will show
  return null;
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: "#FFF3EC" },
  inner: { paddingVertical: 15, paddingHorizontal: 1, alignItems: "stretch", width: '100%' },
  shadow: { shadowColor: "#0B1220", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  header: { width: "100%", marginTop: 15, paddingHorizontal:2, borderRadius: 4, marginBottom: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#2E7D32" },
  greetingLarge: { fontSize: 13, color: '#8A96A2', marginBottom: 4 },
  greetingName: { fontSize: 18, fontWeight: '800', color: '#07112A', marginBottom: 2, textAlign: 'center' },
  heroSub: { color: "#fff", fontSize: 13 },
  heroSubSmall: { color: '#fff', fontSize: 12, marginTop: 4 },
  dateSmall: { fontSize: 12, color: '#fff', fontWeight: '700' },
  greetingNameCenter: { fontSize: 16, fontWeight: '800', color: '#fff' },
  avatarWrapLeft: { marginRight: 12, alignItems: 'flex-start' },
  avatarCircleLeft: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', borderWidth: 0 },
  avatarImg: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F1F5F9' },
  avatarInitialLeft: { fontSize: 14, fontWeight: '800', color: '#374151' },
  calendarBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 16, fontWeight: '800', color: '#065F46' },
  cardsRow: { width: "100%", maxWidth: 980, flexDirection: "row", justifyContent: "space-between", gap: 16, marginBottom: 18 },
  card: { flex: 1, minWidth: 260, backgroundColor: "#FFFFFF", borderRadius: 14, padding: 20, marginBottom: 14, borderWidth: 0 },
  cardHeaderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0e4f11ff" },
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
  motivationTextInline: { color: '#2E7D32', fontSize: 15, fontWeight: 300 },
  heroSubSmall: { color: '#fff', fontSize: 12, marginTop: 6 },
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