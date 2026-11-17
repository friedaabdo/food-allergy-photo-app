import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { t } from '../i18n';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // Make sure the splash screen goes away when signed out
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert(t('signIn.missingTitle'), t('signIn.missingBody'));
      return;
    }

    setLoading(true);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Where the confirmation email link should send people: back into this app
          emailRedirectTo: Linking.createURL('/email-confirmed'),
        },
      });
      if (error) {
        Alert.alert(t('signIn.signUpFailed'), error.message);
      } else if (!data.session) {
        // Happens when "Confirm email" is turned on in Supabase
        Alert.alert(t('signIn.checkEmailTitle'), t('signIn.checkEmailBody'));
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert(t('signIn.signInFailed'), error.message);
    }

    // On success the app switches to the home screen by itself
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>{isSignUp ? t('signIn.createAccount') : t('signIn.welcomeBack')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('signIn.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextInput
        style={styles.input}
        placeholder={t('signIn.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
        textContentType={isSignUp ? 'newPassword' : 'password'}
      />

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 12 }} />
      ) : (
        <Pressable style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>{isSignUp ? t('signIn.signUp') : t('signIn.signIn')}</Text>
        </Pressable>
      )}

      <Pressable onPress={() => setIsSignUp(!isSignUp)} disabled={loading}>
        <Text style={styles.link}>
          {isSignUp ? t('signIn.haveAccount') : t('signIn.noAccount')}
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 14, fontSize: 16, marginBottom: 12,
  },
  button: {
    backgroundColor: '#208AEF', paddingVertical: 14, borderRadius: 10,
    alignItems: 'center', marginTop: 4, marginBottom: 16,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  link: { color: '#208AEF', fontSize: 16, textAlign: 'center' },
});
