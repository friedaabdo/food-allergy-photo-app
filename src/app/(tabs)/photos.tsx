import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { CoinBalance } from '../../components/coin-balance';
import { t } from '../../i18n';

// Photos are stored like: photos/<user-id>/<timestamp>/front.jpg
// Each <timestamp> folder is one "set" (one food package).

type Photo = { label: string; path: string; url: string };
type PhotoSet = { id: string; date: Date; photos: Photo[] };

const ORDER = ['front', 'back', 'side1', 'side2'];
const LABELS: Record<string, string> = { front: 'common.front', back: 'common.back', side1: 'common.side1', side2: 'common.side2' };

export default function PhotosScreen() {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const [sets, setSets] = useState<PhotoSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState<Photo | null>(null); // the photo shown full screen

  const loadPhotos = useCallback(async () => {
    const userId = session?.user.id;
    if (!userId) return;
    setError('');

    try {
      const bucket = supabase.storage.from('photos');

      // 1. Get this user's set folders, newest first
      const { data: folders, error: folderError } = await bucket.list(userId, {
        limit: 100,
        sortBy: { column: 'name', order: 'desc' },
      });
      if (folderError) throw folderError;

      // 2. Get the files inside each set folder
      const setFolders = (folders ?? []).filter((f) => !f.name.startsWith('.'));
      const filesPerSet = await Promise.all(
        setFolders.map(async (folder) => {
          const { data: files, error: fileError } = await bucket.list(`${userId}/${folder.name}`);
          if (fileError) throw fileError;
          return {
            id: folder.name,
            paths: (files ?? [])
              .filter((f) => !f.name.startsWith('.'))
              .map((f) => `${userId}/${folder.name}/${f.name}`),
          };
        })
      );

      // 3. The bucket is private, so ask for temporary links (valid 1 hour) to show the images
      const allPaths = filesPerSet.flatMap((s) => s.paths);
      if (allPaths.length === 0) {
        setSets([]);
        return;
      }
      const { data: signed, error: signError } = await bucket.createSignedUrls(allPaths, 60 * 60);
      if (signError) throw signError;
      const urlFor = new Map(signed.map((s) => [s.path, s.signedUrl]));

      // 4. Put it all together, with photos in Front/Back/Side order
      const result: PhotoSet[] = filesPerSet
        .filter((s) => s.paths.length > 0)
        .map((s) => ({
          id: s.id,
          date: new Date(Number(s.id)),
          photos: s.paths
            .map((path) => {
              const name = path.split('/').pop()!.split('.')[0]; // "front"
              return { label: LABELS[name] ?? name, path, url: urlFor.get(path) ?? '' };
            })
            .sort((a, b) => ORDER.indexOf(a.path.split('/').pop()!.split('.')[0]) -
                            ORDER.indexOf(b.path.split('/').pop()!.split('.')[0])),
        }));

      setSets(result);
    } catch (err: any) {
      console.warn(err); // the technical details, for you in the Expo terminal
      setError(t('photos.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user.id]);

  // Reload every time this tab is opened, so new uploads show up
  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [loadPhotos])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100, paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPhotos(); }} />
        }
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Text style={styles.heading}>{t('photos.title')}</Text>
            <CoinBalance />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <>
                <Text style={styles.emptyText}>{t('photos.empty')}</Text>
                <Pressable style={styles.button} onPress={() => router.push('/capture')}>
                  <Text style={styles.buttonText}>{t('common.takePhotos')}</Text>
                </Pressable>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.date}>
              {item.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              {' · '}
              {item.date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </Text>
            <View style={styles.row}>
              {item.photos.map((photo) => (
                <Pressable key={photo.path} onPress={() => setViewing(photo)} style={styles.thumbWrap}>
                  {/* cacheKey keeps the image cached even though the link changes each load */}
                  <Image source={{ uri: photo.url, cacheKey: photo.path }} style={styles.thumb} contentFit="cover" />
                  <Text style={styles.thumbLabel}>{t(photo.label)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />

      {/* Full-screen view when a photo is tapped */}
      <Modal visible={!!viewing} animationType="fade" onRequestClose={() => setViewing(null)}>
        <View style={styles.viewer}>
          {viewing && (
            <Image
              source={{ uri: viewing.url, cacheKey: viewing.path }}
              style={StyleSheet.absoluteFill}
              contentFit="contain"
            />
          )}
          <Pressable onPress={() => setViewing(null)} hitSlop={20} style={[styles.closeButton, { top: insets.top + 12 }]}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          {viewing && <Text style={[styles.viewerLabel, { bottom: insets.bottom + 24 }]}>{t(viewing.label)}</Text>}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heading: { fontSize: 28, fontWeight: 'bold' },
  card: { backgroundColor: '#F0F0F3', borderRadius: 12, padding: 12, marginBottom: 16 },
  date: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumbWrap: { alignItems: 'center' },
  thumb: { width: 76, height: 76, borderRadius: 8, backgroundColor: '#ddd' },
  thumbLabel: { fontSize: 12, color: '#555', marginTop: 4 },
  emptyText: { fontSize: 18, color: '#888', marginBottom: 16 },
  errorText: { fontSize: 16, color: '#c00', textAlign: 'center' },
  button: { backgroundColor: '#208AEF', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  viewer: { flex: 1, backgroundColor: '#000' },
  closeButton: { position: 'absolute', left: 20, padding: 8 },
  closeText: { color: '#fff', fontSize: 28 },
  viewerLabel: { position: 'absolute', alignSelf: 'center', color: '#fff', fontSize: 18, fontWeight: '600' },
});