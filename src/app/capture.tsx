import { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

const STEPS = ['Front', 'Back', 'Side 1', 'Side 2'];
type Photo = { label: string; uri: string };

export default function CaptureScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [stepIndex, setStepIndex] = useState(0);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  function close() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  async function takePicture() {
    if (busy || !cameraRef.current) return;
    setBusy(true);
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (!pic) return;

      const label = STEPS[stepIndex];
      const newPhotos = [...photos, { label, uri: pic.uri }];
      setPhotos(newPhotos);

      if (label === 'Back') {
        Alert.alert('Sides', 'Is there important information on the sides?', [
          { text: 'No', onPress: () => uploadPhotos(newPhotos) },
          { text: 'Yes', onPress: () => setStepIndex(stepIndex + 1) },
        ]);
      } else if (stepIndex === STEPS.length - 1) {
        uploadPhotos(newPhotos);
      } else {
        setStepIndex(stepIndex + 1);
      }
    } catch (err: any) {
      Alert.alert('Could not take photo', err.message ?? 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhotos(list: Photo[]) {
    setUploading(true);
    try {
      const folder = Date.now().toString();

      for (const photo of list) {
        const ext = photo.uri.split('.').pop()?.toLowerCase() || 'jpg';
        const name = photo.label.toLowerCase().replace(/\s+/g, ''); // "Side 1" → "side1"
        const fileData = await fetch(photo.uri).then((res) => res.arrayBuffer());

        const { error } = await supabase.storage
          .from('photos')
          .upload(`${folder}/${name}.${ext}`, fileData, {
            contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
          });

        if (error) throw error;
      }

      Alert.alert('Uploaded! ✅', `${list.length} photos saved.`);
      close();
    } catch (err: any) {
      Alert.alert('Upload failed', err.message ?? 'Something went wrong.');
    } finally {
      setUploading(false);
    }
  }

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.permissionText}>We need your permission to use the camera.</Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Allow Camera</Text>
        </Pressable>
        <Pressable onPress={close}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      <View style={styles.topBar}>
        <Pressable onPress={close} hitSlop={20} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <Text style={styles.instructionSmall}>Take a photo of the</Text>
        <Text style={styles.instructionBig}>{STEPS[stepIndex].toUpperCase()}</Text>
        <Text style={styles.instructionSmall}>of the package</Text>
      </View>

      <View style={styles.bottomBar}>
        <Pressable onPress={takePicture} disabled={busy || uploading} style={styles.shutterOuter}>
          <View style={[styles.shutterInner, busy && { opacity: 0.5 }]} />
        </Pressable>
      </View>

      {uploading && (
        <View style={[StyleSheet.absoluteFill, styles.center, styles.overlay]}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.uploadingText}>Uploading photos...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  closeButton: { position: 'absolute', top: 55, left: 20, padding: 8 },
  closeText: { color: '#fff', fontSize: 24 },
  instructionSmall: { color: '#fff', fontSize: 16 },
  instructionBig: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 4 },
  bottomBar: { position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff' },
  overlay: { backgroundColor: 'rgba(0,0,0,0.7)' },
  uploadingText: { color: '#fff', fontSize: 18, marginTop: 12 },
  permissionText: { color: '#fff', fontSize: 18, textAlign: 'center', marginBottom: 20 },
  permissionButton: { backgroundColor: '#208AEF', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10, marginBottom: 12 },
  permissionButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  cancelText: { color: '#aaa', fontSize: 16 },
});