import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="capture"
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />
    </Stack>
  );
}