import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DodoColors } from '@/constants/theme';
import { uploadFiles } from '@/shared/api/fileApi';
import { pickMultipleImages, toLocalFile } from '@/shared/lib/files/pickImage';

type Item = { key: string; uri: string; uploading: boolean };

type Props = {
  imageUrls: string[];
  onChange: (urls: string[]) => void;
  maxCount?: number;
};

let keySeq = 0;

export function MultiImagePicker({ imageUrls, onChange, maxCount = 10 }: Props) {
  const [items, setItems] = useState<Item[]>(() =>
    imageUrls.map((uri) => ({ key: String(keySeq++), uri, uploading: false })),
  );

  const commit = (next: Item[]) => {
    setItems(next);
    onChange(next.filter((i) => !i.uploading).map((i) => i.uri));
  };

  const handleAdd = async () => {
    const remaining = maxCount - items.length;
    if (remaining <= 0) {
      Alert.alert('알림', `이미지는 최대 ${maxCount}장까지 첨부할 수 있어요.`);
      return;
    }

    try {
      const assets = await pickMultipleImages(remaining);
      if (assets.length === 0) return;

      const pending: Item[] = assets.map((asset) => ({ key: String(keySeq++), uri: asset.uri, uploading: true }));
      const withPending = [...items, ...pending];
      setItems(withPending);

      const { imageUrls: uploaded } = await uploadFiles(assets.map(toLocalFile));

      const resolved = withPending.map((item) => {
        const pendingIndex = pending.findIndex((p) => p.key === item.key);
        if (pendingIndex === -1) return item;
        return { ...item, uri: uploaded[pendingIndex] ?? item.uri, uploading: false };
      });
      commit(resolved);
    } catch (error) {
      setItems(items);
      Alert.alert('오류', error instanceof Error ? error.message : '이미지를 업로드하지 못했어요.');
    }
  };

  const handleRemove = (key: string) => {
    commit(items.filter((i) => i.key !== key));
  };

  return (
    <View>
      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <Ionicons name="image-outline" size={16} color={DodoColors.textSecondary} />
        <Text style={styles.addButtonText}>이미지 추가</Text>
      </TouchableOpacity>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>아직 첨부된 이미지가 없어요.</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
          {items.map((item) => (
            <View key={item.key} style={styles.thumbWrap}>
              <Image source={{ uri: item.uri }} style={styles.thumb} contentFit="cover" />
              {item.uploading && (
                <View style={styles.thumbOverlay}>
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              )}
              {!item.uploading && (
                <TouchableOpacity style={styles.removeButton} onPress={() => handleRemove(item.key)}>
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.surface,
    marginBottom: 10,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  empty: {
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: DodoColors.border,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: DodoColors.fenceIdleLabel,
  },
  row: {
    flexDirection: 'row',
  },
  thumbWrap: {
    width: 76,
    height: 76,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 8,
    position: 'relative',
    backgroundColor: DodoColors.background,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
