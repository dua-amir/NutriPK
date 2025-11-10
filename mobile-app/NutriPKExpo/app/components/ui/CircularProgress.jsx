import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle as SvgCircle, G } from 'react-native-svg';

export const CircularProgress = ({ percentage = 0, value, label, unit = '', color = '#4CAF50', radius = 40, strokeWidth = 10, forceFull = false }) => {
  const size = radius * 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * (radius - strokeWidth / 2);
  const progressValue = Math.min(percentage, 100) / 100;
  const strokeDashoffset = circumference * (1 - progressValue);

  useEffect(() => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // debug info for device logs to help diagnose rendering issues on Expo Go
      console.log('[DEV] CircularProgress debug', { circumference, progressValue, strokeDashoffset, radius, strokeWidth });
    }
  }, [circumference, progressValue, strokeDashoffset, radius, strokeWidth]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.backgroundCircle, { backgroundColor: color }]}>
        <View style={styles.contents}>
          <Text style={styles.value}>{value}{unit}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      </View>
      <Svg style={StyleSheet.absoluteFill} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation={-90} originX={center} originY={center}>
          <SvgCircle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2}
            stroke="#E8E8E8"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <SvgCircle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2}
            stroke={color || '#065F46'}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={forceFull ? 0 : strokeDashoffset}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundCircle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 998,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contents: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    color: '#fff',
    marginTop: 3,
    textAlign: 'center',
  },
});

export default CircularProgress;