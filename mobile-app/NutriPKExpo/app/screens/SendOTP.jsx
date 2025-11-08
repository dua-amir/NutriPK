import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BACKEND_BASE } from '../config';

const THEME = '#FF7F32';

export default function SendOTP() {
  const router = useRouter();
  // useSearchParams isn't available on some web entry bundles; attempt optional import at runtime
  let email = '';
  try {
    // attempt to require useSearchParams dynamically
    // eslint-disable-next-line global-require
    const { useSearchParams } = require('expo-router');
    const sp = useSearchParams();
    email = sp?.email || '';
  } catch (e) {
    // fallback: try to parse window.location.search (web)
    try {
      const qs = typeof window !== 'undefined' ? window.location.search : '';
      if (qs) {
        const params = new URLSearchParams(qs);
        email = params.get('email') || '';
      }
    } catch (e2) {
      email = '';
    }
  }

  const [otp, setOtp] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [info, setInfo] = React.useState('');
  const [secondsLeft, setSecondsLeft] = React.useState(56);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    // focus the hidden input on mount
    try { inputRef.current && inputRef.current.focus(); } catch (e) {}
    // start countdown
    let timer = null;
    if (secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(timer);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  const verifyOtp = async () => {
    setError('');
    setInfo('');
    if (!otp || otp.length < 6) {
      setError('Please enter the full 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
        const response = await fetch(`${BACKEND_BASE}/api/user/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || 'OTP verification failed.');
        setLoading(false);
        return;
      }
      setLoading(false);
      // On success, navigate to password reset screen with token if provided
      if (data && data.token) {
        router.push(`/reset-password?token=${encodeURIComponent(data.token)}`);
        return;
      }
      // fallback navigation
      router.push('/reset-password');
    } catch (err) {
      setLoading(false);
      setError('Network error. Please try again.');
    }
  };

  const resendOtp = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
  const response = await fetch(`${BACKEND_BASE}/api/user/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || 'Failed to resend OTP.');
        setLoading(false);
        return;
      }
      setLoading(false);
      setInfo('OTP resent. Check your email.');
      // reset countdown
      setSecondsLeft(56);
      try { inputRef.current && inputRef.current.focus(); } catch (e) {}
    } catch (err) {
      setLoading(false);
      setError('Network error. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Enter the OTP</Text>
        <Text style={styles.subtitle}>Enter the OTP sent to your email to verify your account.</Text>

        <View style={styles.otpRow}>
          {/* Hidden text input to capture numeric keyboard - overlaying the boxes */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
            value={otp}
            onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 6))}
            maxLength={6}
            autoFocus
          />
          <TouchableOpacity activeOpacity={1} style={styles.digitsRow} onPress={() => { try { inputRef.current && inputRef.current.focus(); } catch(e){} }}>
            {Array.from({ length: 6 }).map((_, i) => {
              const char = otp[i] || '';
              const isActive = otp.length === i;
              return (
                <View key={i} style={[styles.digitBox, isActive && styles.digitBoxActive]}>
                  <Text style={styles.digitText}>{char}</Text>
                </View>
              );
            })}
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <TouchableOpacity style={[styles.verifyButton, loading && styles.disabled]} onPress={verifyOtp} disabled={loading || otp.length < 6}>
          <Text style={styles.verifyText}>{loading ? 'Verifying...' : 'Verify'}</Text>
        </TouchableOpacity>
        <View style={styles.resendContainer}>
          {secondsLeft > 0 ? (
            <Text style={styles.countdownText}>You can resend the code in {secondsLeft} seconds</Text>
          ) : null}
          <TouchableOpacity style={styles.resendRow} onPress={resendOtp} disabled={secondsLeft > 0}>
            <Text style={[styles.resendText, secondsLeft > 0 && styles.resendDisabled]}>Resend code</Text>
          </TouchableOpacity>
        </View>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3EC',
  },
  header: {
    height: 56,
    justifyContent: 'center',
    paddingLeft: 8,
  },
  back: {
    padding: 8,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0e4f11ff',
    marginTop: 6,
    marginBottom: 6,
  },
  subtitle: {
    color: '#7B8794',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  otpRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  otpInput: {
    width: 220,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    fontSize: 22,
    letterSpacing: 8,
    color: '#111',
    backgroundColor: '#FAFAFA',
  },
  hiddenInput: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0,
  },
  digitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#fff',
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitBoxActive: {
    borderColor: '#0e4f11ff',
    shadowColor: '#0e4f11ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  digitText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
  },
  error: {
    color: 'red',
    marginTop: 8,
  },
  info: {
    color: '#333',
    marginTop: 8,
  },
  countdownText: {
    color: '#7B8794',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },
  verifyButton: {
    marginTop: 24,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0e4f11ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
  resendRow: {
    marginTop: 6,
    alignItems: 'center',
  },
  resendText: {
    color: '#0e4f11ff',
    fontWeight: '600',
  },
  resendDisabled: {
    color: '#BFBFBF',
  },
});