import { useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

const STEPS = ['Front', 'Back', 'Side 1', 'Side 2'];

export default function CaptureScreen() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const stepIndex = photos.length;
  const isDone = stepIndex >= STEPS.length;

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Please allow camera access in Settings.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  }

  function retakeLast() {
    setPhotos(photos.slice(0, -1));
  }

  async function uploadPhotos() {
    setUploading(true);
    try {
      // One folder per set of photos, named with the current time
      const folder = Date.now().toString();

      for (let i = 0; i < photos.length; i++) {
        const uri = photos[i];
        const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const name = STEPS[i].toLowerCase().replace(/\s+/g, ''); // "left-side"

        // Read the photo file from the phone
        const fileData = await fetch(uri).then((res) => res.arrayBuffer());

        // Upload it to the "photos" bucket
        const { error } = await supabase.storage
          .from('photos')
          .upload(`${folder}/${name}.${ext}`, fileData, {
            contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
          });

        if (error) throw error;
      }

      Alert.alert('Uploaded! ✅', 'All 4 photos were saved.');
      router.back();
    } catch (err: any) {
      Alert.alert('Upload failed', err.message ?? 'Something went wrong.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      {isDone ? (
        <Text style={styles.title}>All photos taken ✅</Text>
      ) : (
        <>
          <Text style={styles.stepCount}>
            Step {stepIndex + 1} of {STEPS.length}
          </Text>
          <Text style={styles.title}>Take a photo of the {STEPS[stepIndex]}</Text>
        </>
      )}

      <View style={styles.grid}>
        {STEPS.map((label, i) => (
          <View key={label} style={styles.slot}>
            {photos[i] ? (
              <Image source={{ uri: photos[i] }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.empty, i === stepIndex && styles.current]} />
            )}
            <Text style={styles.label}>{label}</Text>
          </View>
        ))}
      </View>

      {uploading ? (
        <ActivityIndicator size="large" />
      ) : isDone ? (
        <Pressable style={styles.button} onPress={uploadPhotos}>
          <Text style={styles.buttonText}>Upload Photos</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>📷 Take {STEPS[stepIndex]} Photo</Text>
        </Pressable>
      )}

      {photos.length > 0 && !uploading && (
        <Pressable onPress={retakeLast}>
          <Text style={styles.link}>Retake last photo</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  stepCount: { fontSize: 16, color: '#888', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginBottom: 24 },
  slot: { alignItems: 'center' },
  thumb: { width: 140, height: 140, borderRadius: 10 },
  empty: { backgroundColor: '#eee' },
  current: { borderWidth: 3, borderColor: '#208AEF' },
  label: { marginTop: 6, fontSize: 14 },
  button: { backgroundColor: '#208AEF', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10, marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  link: { color: '#208AEF', fontSize: 16 },
});