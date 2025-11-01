import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Home() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const fetchUsername = async () => {
      const email = await AsyncStorage.getItem('email');
      setUsername(email || "User");
    };
    fetchUsername();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome {username}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
});