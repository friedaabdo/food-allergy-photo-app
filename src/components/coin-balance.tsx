import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

// Reward rules, kept in one place so every screen agrees.
// These must match the numbers in supabase/rewards.sql.
export const COINS_PER_SET = 3; // coins earned for each item photographed
export const COIN_GOAL = 150; // coins needed to claim a gift card
export const GIFT_CARD_AMOUNT = '$5';

// Gets the signed-in user's coin balance from Supabase:
// coins earned from photos, minus coins already spent on gift cards.
// Re-checks every time the screen is opened. Call refresh() to re-check on demand.
export function useCoinBalance(enabled = true) {
  const { session } = useAuth();
  const [coins, setCoins] = useState(0);

  const refresh = useCallback(async () => {
    if (!session?.user.id) return;
    const { data, error } = await supabase.rpc('get_coin_balance');
    if (!error && typeof data === 'number') setCoins(Math.max(data, 0));
  }, [session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      if (enabled) refresh();
    }, [enabled, refresh])
  );

  return { coins, refresh };
}

type Props = {
  // Pass the balance if the screen already has it (like My Rewards).
  // Leave it out and the component looks it up itself.
  coins?: number;
  style?: StyleProp<ViewStyle>;
};

export function CoinBalance({ coins, style }: Props) {
  const fetched = useCoinBalance(coins === undefined);

  return (
    <View style={[styles.row, style]}>
      <Image source={require('@/assets/images/coin.png')} style={styles.icon} contentFit="contain" />
      <Text style={styles.text}>{coins ?? fetched.coins}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon: { width: 24, height: 24 },
  text: { fontSize: 24, color: '#555' },
});
