import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={{...styles.title, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20}}>
        Welcome to the Food Photo App
      </Text>
      <Text style={{ marginBottom: 20, textAlign: 'center',paddingHorizontal: 20}}>
        This app allows you to take photos of your food packaging and upload them to a Supabase storage bucket. 
        You can capture multiple angles of your food and store them securely in the cloud.
      </Text>
   

      <Pressable style={styles.button} onPress={() => router.push('/capture')}>
        <Text style={styles.buttonText}>Take Photos</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#208AEF',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});