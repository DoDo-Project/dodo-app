import * as ImagePicker from 'expo-image-picker';

import type { LocalFile } from '@/shared/api/fileApi';

import { inferMimeType, validateImageFile, validateImageFiles, type PickedImage } from './imageUploadPolicy';

async function ensureLibraryPermission(): Promise<void> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('사진 접근 권한이 필요해요. 설정에서 권한을 허용해주세요.');
  }
}

/** 사진 1장 선택 (프로필/펫 등록 사진용). 취소 시 null. */
export async function pickSingleImage(): Promise<PickedImage | null> {
  await ensureLibraryPermission();

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });

  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  validateImageFile(asset);
  return asset;
}

/** 사진 여러 장 선택 (게시글 첨부용). 취소 시 빈 배열. */
export async function pickMultipleImages(maxCount: number): Promise<PickedImage[]> {
  await ensureLibraryPermission();

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsMultipleSelection: true,
    selectionLimit: maxCount,
  });

  if (result.canceled || result.assets.length === 0) return [];

  validateImageFiles(result.assets);
  return result.assets;
}

export function toLocalFile(asset: PickedImage): LocalFile {
  return {
    uri: asset.uri,
    name: asset.fileName ?? 'photo.jpg',
    type: asset.mimeType ?? inferMimeType(asset.uri, asset.fileName),
  };
}
