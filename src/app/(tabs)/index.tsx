import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { CoinBalance, COINS_PER_SET } from '../../components/coin-balance';
import {t} from '../../i18n';

// The four photos the capture screen asks for, in order
const SIDES = ['Front', 'Back', 'Side 1', 'Side 2'];

export default function HomeScreen() {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100, paddingHorizontal: 16 }}
    >
      {/* Same header layout as My Items: heading on the left, coins on the right */}
      <View style={styles.headerRow}>
        <Text style={styles.heading}>{t('home.title')}</Text>
        <CoinBalance />
      </View>

      <Text style={styles.title}>Scan a food package</Text>
      <Text style={styles.body}>
        Take four photos of the package so its label and ingredients are saved to your items.
        Each package earns {COINS_PER_SET} coins.
      </Text>

      {/* A picture of the four photos you'll take */}
      <View style={styles.sideGrid}>
        {SIDES.map((side, i) => (
          <View key={side} style={styles.sideTile}>
            <Text style={styles.sideNumber}>{i + 1}</Text>
            <Text style={styles.sideLabel}>{side}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => router.push('/capture')}
      >
        <Text style={styles.buttonText}>Take photos</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.push('/photos')}>
        <Text style={styles.secondaryText}>See my items</Text>
      </Pressable>

      <View style={styles.account}>
        <Text style={styles.signedIn}>Signed in as {session?.user.email}</Text>
        <Pressable onPress={() => supabase.auth.signOut()} hitSlop={10}>
          <Text style={styles.link}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const BLUE = '#208AEF';
const INK = '#1C2430';
const MUTED = '#6B7480';
const TINT = '#EEF5FD';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  heading: { fontSize: 28, fontWeight: 'bold', color: INK },
  title: { fontSize: 22, fontWeight: '700', color: INK, marginBottom: 8 },
  body: { fontSize: 16, lineHeight: 23, color: MUTED, marginBottom: 24 },
  sideGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  sideTile: {
    width: '47%',
    flexGrow: 1,
    aspectRatio: 1.4,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#B9D7F7',
    backgroundColor: TINT,
    padding: 12,
    justifyContent: 'space-between',
  },
  sideNumber: { fontSize: 15, fontWeight: '700', color: BLUE },
  sideLabel: { fontSize: 17, fontWeight: '600', color: INK },
  button: { backgroundColor: BLUE, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  secondaryButton: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  secondaryText: { color: BLUE, fontSize: 17, fontWeight: '600' },
  account: { marginTop: 40, paddingTop: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#D5D9DE', alignItems: 'center', gap: 8 },
  signedIn: { color: MUTED, fontSize: 14 },
  link: { color: BLUE, fontSize: 16 },
});
