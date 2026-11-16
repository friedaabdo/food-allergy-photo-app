import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

// Each photo set (one food package) earns this many coins.
export const COINS_PER_SET = 3;

type Props = {
  // Pass the number of photo sets if the screen already knows it (like My Items).
  // Leave it out and the component looks it up itself (like the Home screen).
  setCount?: number;
  style?: StyleProp<ViewStyle>;
};

export function CoinBalance({ setCount, style }: Props) {
  const { session } = useAuth();
  const [fetchedCount, setFetchedCount] = useState(0);

  // Only look up the count when the screen didn't give us one.
  // Runs every time the screen is opened, so new uploads are counted.
  useFocusEffect(
    useCallback(() => {
      const userId = session?.user.id;
      if (setCount !== undefined || !userId) return;
      supabase.storage
        .from('photos')
        .list(userId, { limit: 1000 })
        .then(({ data }) => {
          setFetchedCount((data ?? []).filter((f) => !f.name.startsWith('.')).length);
        });
    }, [session?.user.id, setCount])
  );

  const coins = (setCount ?? fetchedCount) * COINS_PER_SET;

  return (
    <View style={[styles.row, style]}>
      <Image source={require('@/assets/images/coin.png')} style={styles.icon} contentFit="contain" />
      <Text style={styles.text}>{coins}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon: { width: 24, height: 24 },
  text: { fontSize: 24, color: '#555' },
});
