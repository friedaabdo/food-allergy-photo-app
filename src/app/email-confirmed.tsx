import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

// The confirmation email link opens this screen.
// Supabase adds the login info to the end of the link, after a "#":
//   .../email-confirmed#access_token=...&refresh_token=...&type=signup
// If something went wrong, it adds an error instead:
//   .../email-confirmed#error=...&error_description=Email+link+is+invalid+or+has+expired

export default function EmailConfirmedScreen() {
  const url = Linking.useURL(); // the link that opened the app
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!url) return;

    // Grab everything after the "#" and read it like a list of name=value pairs
    const params = new URLSearchParams(url.split('#')[1] ?? '');

    const error = params.get('error_description');
    if (error) {
      setErrorMessage(error);
      setStatus('error');
      return;
    }

    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) {
      setErrorMessage('This link is missing confirmation info.');
      setStatus('error');
      return;
    }

    // Sign the user in with the info from the link
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) {
        setErrorMessage(error.message);
        setStatus('error');
      } else {
        setStatus('success');
      }
    });
  }, [url]);

  if (status === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.body}>Confirming your email…</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>⚠️</Text>
        <Text style={styles.title}>Couldn't confirm your email</Text>
        <Text style={styles.body}>{errorMessage}</Text>
        <Pressable style={styles.button} onPress={() => router.replace('/sign-in')}>
          <Text style={styles.buttonText}>Back to sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>✅</Text>
      <Text style={styles.title}>Email confirmed!</Text>
      <Text style={styles.body}>Your account is ready and you're signed in.</Text>
      <Pressable style={styles.button} onPress={() => router.replace('/')}>
        <Text style={styles.buttonText}>Get started</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  body: { fontSize: 16, color: '#555', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  button: { backgroundColor: '#208AEF', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
