// 웹(dodo-frontend)의 shared/lib/files/imageUploadPolicy.ts와 동일한 정책.

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'] as const;

export const MAX_IMAGE_FILE_SIZE_MB = 10;
export const MAX_IMAGE_FILE_SIZE = MAX_IMAGE_FILE_SIZE_MB * 1024 * 1024;

export const MAX_IMAGE_UPLOAD_REQUEST_SIZE_MB = 50;
export const MAX_IMAGE_UPLOAD_REQUEST_SIZE = MAX_IMAGE_UPLOAD_REQUEST_SIZE_MB * 1024 * 1024;

export const IMAGE_UPLOAD_POLICY_DESCRIPTION = `PNG, JPG 형식 / 최대 ${MAX_IMAGE_FILE_SIZE_MB}MB`;

export interface PickedImage {
  uri: string;
  mimeType?: string | null;
  fileSize?: number | null;
  fileName?: string | null;
}

function isAllowedImageMimeType(type: string | null | undefined): boolean {
  if (!type) return true; // 일부 플랫폼은 mimeType을 안 줄 수 있음 — 그런 경우는 통과시키고 서버 검증에 맡김
  return ALLOWED_IMAGE_MIME_TYPES.includes(type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number]);
}

export function validateImageFile(file: PickedImage): void {
  if (!isAllowedImageMimeType(file.mimeType)) {
    throw new Error('JPG 또는 PNG 이미지 파일만 업로드할 수 있어요.');
  }
  if (file.fileSize != null && file.fileSize > MAX_IMAGE_FILE_SIZE) {
    throw new Error(`이미지 한 장당 최대 ${MAX_IMAGE_FILE_SIZE_MB}MB까지 업로드할 수 있어요.`);
  }
}

export function validateImageFiles(files: PickedImage[]): void {
  files.forEach(validateImageFile);

  const totalSize = files.reduce((sum, file) => sum + (file.fileSize ?? 0), 0);
  if (totalSize > MAX_IMAGE_UPLOAD_REQUEST_SIZE) {
    throw new Error(`한 번의 요청으로는 최대 ${MAX_IMAGE_UPLOAD_REQUEST_SIZE_MB}MB까지 업로드할 수 있어요.`);
  }
}

/** 파일명에서 확장자로 대략적인 MIME 타입 추론 (expo-image-picker가 mimeType을 안 줄 때 fileApi 업로드용) */
export function inferMimeType(uri: string, fileName?: string | null): string {
  const name = fileName ?? uri;
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  return 'image/jpeg';
}
