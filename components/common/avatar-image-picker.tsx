import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DodoColors } from '@/constants/theme';
import { uploadFiles } from '@/shared/api/fileApi';
import { IMAGE_UPLOAD_POLICY_DESCRIPTION } from '@/shared/lib/files/imageUploadPolicy';
import { pickSingleImage, toLocalFile } from '@/shared/lib/files/pickImage';

type Props = {
  imageUrl: string | null;
  onUploaded: (url: string) => void;
  /** 회원가입 중처럼 정식 accessToken이 아직 없을 때(registrationToken) 전달 */
  authToken?: string;
  size?: number;
};

export function AvatarImagePicker({ imageUrl, onUploaded, authToken, size = 64 }: Props) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const displayUrl = localPreview ?? imageUrl;

  const handlePick = async () => {
    if (uploading) return;
    setError('');

    try {
      const asset = await pickSingleImage();
      if (!asset) return;

      setLocalPreview(asset.uri);
      setUploading(true);

      const { imageUrls } = await uploadFiles([toLocalFile(asset)], authToken);
      if (imageUrls[0]) onUploaded(imageUrls[0]);
    } catch (err) {
      setLocalPreview(null);
      setError(err instanceof Error ? err.message : '이미지 업로드에 실패했어요.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrap}>
        {displayUrl ? (
          <Image
            source={{ uri: displayUrl }}
            style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
            <Ionicons name="paw" size={size * 0.44} color={DodoColors.brandForeground} />
          </View>
        )}
        {uploading && (
          <View style={[styles.uploadingOverlay, { width: size, height: size, borderRadius: size / 2 }]}>
            <ActivityIndicator color="#fff" size="small" />
          </View>
        )}
        <TouchableOpacity style={styles.editButton} onPress={handlePick} disabled={uploading}>
          <Ionicons name="pencil" size={13} color={DodoColors.brandForeground} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.hint, error && styles.hintError]}>{error || IMAGE_UPLOAD_POLICY_DESCRIPTION}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: DodoColors.background,
  },
  avatarFallback: {
    backgroundColor: DodoColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  editButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: DodoColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: DodoColors.surface,
  },
  hint: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
    textAlign: 'center',
  },
  hintError: {
    color: DodoColors.fenceOutside,
  },
});
