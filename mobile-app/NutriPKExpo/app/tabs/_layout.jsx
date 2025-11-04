import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#A0A0A0',
      }}
    >
      <Tabs.Screen name="Home" options={{ title: 'Home', headerShown: false, tabBarIcon: ({ color, size }) => (<Ionicons name="home" size={size} color={color} />) }} />
      <Tabs.Screen name="SavedMeals" options={{ title: 'Saved Meals', headerShown: false, tabBarIcon: ({ color, size }) => (<Ionicons name="bookmark" size={size} color={color} />) }} />
      <Tabs.Screen name="Camera" options={{ title: 'Camera', headerShown: false, tabBarIcon: ({ color, size }) => (<Ionicons name="camera" size={size} color={color} />) }} />
      <Tabs.Screen name="WeeklySummary" options={{ title: 'Weekly', headerShown: false, tabBarIcon: ({ color, size }) => (<Ionicons name="bar-chart" size={size} color={color} />) }} />
      <Tabs.Screen name="Profile" options={{ title: 'Profile', headerShown: false, tabBarIcon: ({ color, size }) => (<Ionicons name="person" size={size} color={color} />) }} />
    </Tabs>
  );
}
