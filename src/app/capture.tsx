import { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { t } from '../i18n';

// Each side's ID. It's used for the file name (front.jpg) and, with "common.",
// as the translation key for the name people see. IDs are never translated.
const STEPS = ['front', 'back', 'side1', 'side2'];
type Photo = { side: string; uri: string };

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

      const side = STEPS[stepIndex];
      const newPhotos = [...photos, { side, uri: pic.uri }];
      setPhotos(newPhotos);

      if (side === 'back') {
        Alert.alert(t('capture.sidesTitle'), t('capture.sidesQuestion'), [
          { text: t('capture.skip'), onPress: () => uploadPhotos(newPhotos) },
          { text: t('capture.takeSides'), onPress: () => setStepIndex(stepIndex + 1) },
        ]);
      } else if (stepIndex === STEPS.length - 1) {
        uploadPhotos(newPhotos);
      } else {
        setStepIndex(stepIndex + 1);
      }
    } catch (err: any) {
      Alert.alert(t('capture.photoFailed'), err.message ?? t('common.somethingWrong'));
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhotos(list: Photo[]) {
    setUploading(true);
    try {
      // Each user gets their own folder, with one subfolder per set of photos
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('capture.signInToUpload'));
      const folder = `${user.id}/${Date.now()}`;

      for (const photo of list) {
        const ext = photo.uri.split('.').pop()?.toLowerCase() || 'jpg';
        const name = photo.side; // "side1" -> side1.jpg
        const fileData = await fetch(photo.uri).then((res) => res.arrayBuffer());

        const { error } = await supabase.storage
          .from('photos')
          .upload(`${folder}/${name}.${ext}`, fileData, {
            contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
          });

        if (error) throw error;
      }

      Alert.alert(t('capture.uploadedTitle'), t('capture.uploadedBody', { count: list.length }));
      close();
    } catch (err: any) {
      Alert.alert(t('capture.uploadFailed'), err.message ?? t('common.somethingWrong'));
    } finally {
      setUploading(false);
    }
  }

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.permissionText}>{t('capture.permission')}</Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>{t('capture.allowCamera')}</Text>
        </Pressable>
        <Pressable onPress={close}>
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
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
        {/* Some languages put words before AND after the side name, some only before */}
        {!!t('capture.before') && <Text style={styles.instructionSmall}>{t('capture.before')}</Text>}
        <Text style={styles.instructionBig}>{t(`common.${STEPS[stepIndex]}`).toUpperCase()}</Text>
        {!!t('capture.after') && <Text style={styles.instructionSmall}>{t('capture.after')}</Text>}
      </View>

      <View style={styles.bottomBar}>
        <Pressable onPress={takePicture} disabled={busy || uploading} style={styles.shutterOuter}>
          <View style={[styles.shutterInner, busy && { opacity: 0.5 }]} />
        </Pressable>
      </View>

      {uploading && (
        <View style={[StyleSheet.absoluteFill, styles.center, styles.overlay]}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.uploadingText}>{t('capture.uploading')}</Text>
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