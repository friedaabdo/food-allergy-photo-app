import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../lib/auth';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { session, isLoading } = useAuth();

  // Keep the splash screen up while we check for a saved login
  if (isLoading) return null;

  return (
    <Stack>
      {/* Only reachable when signed in */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="capture"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
      </Stack.Protected>

      {/* Only reachable when signed out */}
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Reachable whether signed in or not */}
      <Stack.Screen name="email-confirmed" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
