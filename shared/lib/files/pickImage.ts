import * as ImagePicker from 'expo-image-picker';

import type { LocalFile } from '@/shared/api/fileApi';

import { inferMimeType, validateImageFile, validateImageFiles, type PickedImage } from './imageUploadPolicy';

async function ensureLibraryPermission(): Promise<void> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('사진 접근 권한이 필요해요. 설정에서 권한을 허용해주세요.');
  }
}

// 안드로이드 시스템 포토 피커(android.provider.action.PICK_IMAGES)가 없는 기기/에뮬레이터(Play 스토어 미포함 이미지 등)에서
// launchImageLibraryAsync가 던지는 네이티브 에러를 사용자가 이해할 수 있는 메시지로 바꿔준다.
function toFriendlyPickerError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('PICK_IMAGES') || message.includes('ActivityNotFoundException')) {
    return new Error(
      '이 기기에서 사진 선택 기능을 사용할 수 없어요. Google Play 스토어가 포함된 기기/에뮬레이터인지, Google 포토(미디어 선택 도구)가 최신 버전인지 확인해주세요.',
    );
  }
  return error instanceof Error ? error : new Error(message);
}

/** 사진 1장 선택 (프로필/펫 등록 사진용). 취소 시 null. */
export async function pickSingleImage(): Promise<PickedImage | null> {
  await ensureLibraryPermission();

  let result;
  try {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
  } catch (error) {
    throw toFriendlyPickerError(error);
  }

  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  validateImageFile(asset);
  return asset;
}

/** 사진 여러 장 선택 (게시글 첨부용). 취소 시 빈 배열. */
export async function pickMultipleImages(maxCount: number): Promise<PickedImage[]> {
  await ensureLibraryPermission();

  let result;
  try {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: maxCount,
    });
  } catch (error) {
    throw toFriendlyPickerError(error);
  }

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
