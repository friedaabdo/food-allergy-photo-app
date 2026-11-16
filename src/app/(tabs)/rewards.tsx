import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import {
  CoinBalance, useCoinBalance, COINS_PER_SET, COIN_GOAL, GIFT_CARD_AMOUNT,
} from '../../components/coin-balance';

const ITEMS_FOR_GOAL = Math.ceil(COIN_GOAL / COINS_PER_SET); // 50 items

const STEPS = [
  { title: 'Photograph a food package', text: 'Take the front, back and both sides so the label is saved.' },
  { title: `Earn ${COINS_PER_SET} coins`, text: `Every item you photograph adds ${COINS_PER_SET} coins to your total.` },
  { title: `Reach ${COIN_GOAL} coins`, text: `That's ${ITEMS_FOR_GOAL} items. Then you can claim a ${GIFT_CARD_AMOUNT} gift card.` },
];

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const { coins, refresh } = useCoinBalance();
  const [claiming, setClaiming] = useState(false);
  const reached = coins >= COIN_GOAL;
  const progress = Math.min(coins / COIN_GOAL, 1);
  const itemsLeft = Math.max(Math.ceil((COIN_GOAL - coins) / COINS_PER_SET), 0);

  // Asks Supabase to record the claim. Supabase checks the balance itself,
  // so coins can't go below zero even if the button is tapped twice.
  const claim = () => {
    Alert.alert(
      `Claim a ${GIFT_CARD_AMOUNT} gift card?`,
      `${COIN_GOAL} coins will be taken from your balance.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: async () => {
            setClaiming(true);
            const { error } = await supabase.rpc('claim_reward');
            await refresh();
            setClaiming(false);
            if (error) {
              Alert.alert('Gift card not claimed', error.message);
            } else {
              Alert.alert('Gift card claimed', `${COIN_GOAL} coins were taken from your balance.`);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100, paddingHorizontal: 16 }}
    >
      {/* Same header layout as My Items and Home */}
      <View style={styles.headerRow}>
        <Text style={styles.heading}>My Rewards</Text>
        <CoinBalance coins={coins} />
      </View>

      {/* Progress toward the gift card */}
      <View style={styles.goal}>
        <Text style={styles.goalTitle}>{GIFT_CARD_AMOUNT} gift card</Text>
        <View style={styles.goalNumbers}>
          <Image source={require('@/assets/images/coin.png')} style={styles.goalCoin} contentFit="contain" />
          <Text style={styles.goalCoins}>{coins}</Text>
          <Text style={styles.goalOf}> / {COIN_GOAL} coins</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.goalHint}>
          {reached
            ? `You have enough coins for a ${GIFT_CARD_AMOUNT} gift card.`
            : `${itemsLeft} more ${itemsLeft === 1 ? 'item' : 'items'} to go.`}
        </Text>

        <Pressable
          disabled={!reached || claiming}
          onPress={claim}
          style={({ pressed }) => [styles.button, !reached && styles.buttonDisabled, pressed && styles.buttonPressed]}
        >
          {claiming ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.buttonText, !reached && styles.buttonTextDisabled]}>
              {reached ? `Claim ${GIFT_CARD_AMOUNT} gift card` : `Claim at ${COIN_GOAL} coins`}
            </Text>
          )}
        </Pressable>
      </View>

      {/* How it works: a real 1-2-3 sequence */}
      <Text style={styles.sectionTitle}>How it works</Text>
      {STEPS.map((step, i) => (
        <View key={step.title} style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{i + 1}</Text>
          </View>
          <View style={styles.stepBody}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepText}>{step.text}</Text>
          </View>
        </View>
      ))}

      <Pressable style={styles.secondaryButton} onPress={() => router.push('/capture')}>
        <Text style={styles.secondaryText}>Take photos</Text>
      </Pressable>
    </ScrollView>
  );
}

const BLUE = '#208AEF';
const INK = '#1C2430';
const MUTED = '#6B7480';
const TINT = '#EEF5FD';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  heading: { fontSize: 28, fontWeight: 'bold', color: INK },

  goal: { backgroundColor: TINT, borderRadius: 16, padding: 18, marginBottom: 32 },
  goalTitle: { fontSize: 17, fontWeight: '600', color: MUTED, marginBottom: 6 },
  goalNumbers: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  goalCoin: { width: 32, height: 32, marginRight: 8 },
  goalCoins: { fontSize: 40, fontWeight: '800', color: INK },
  goalOf: { fontSize: 20, fontWeight: '600', color: MUTED, marginTop: 10 },
  track: { height: 12, borderRadius: 6, backgroundColor: '#D3E5FA', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6, backgroundColor: BLUE },
  goalHint: { fontSize: 15, color: MUTED, marginTop: 10, marginBottom: 16 },

  button: { backgroundColor: BLUE, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#C9D3DE' },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  buttonTextDisabled: { color: '#fff' },

  sectionTitle: { fontSize: 20, fontWeight: '700', color: INK, marginBottom: 16 },
  step: { flexDirection: 'row', gap: 14, marginBottom: 18 },
  stepNumber: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: BLUE,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumberText: { color: BLUE, fontSize: 15, fontWeight: '700' },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 17, fontWeight: '600', color: INK, marginBottom: 2 },
  stepText: { fontSize: 15, lineHeight: 21, color: MUTED },

  secondaryButton: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  secondaryText: { color: BLUE, fontSize: 17, fontWeight: '600' },
});
