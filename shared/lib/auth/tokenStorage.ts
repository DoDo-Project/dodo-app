import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// 웹(dodo-frontend)의 localStorage/sessionStorage 키 이름을 그대로 따름 (shared/lib/auth/token.ts 참고)
const SECURE_KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'dodo.refreshToken',
} as const;

// expo-secure-store는 웹에서 빈 구현체(export default {})라 호출 시 즉시 에러가 난다.
// 웹은 화면 미리보기 용도일 뿐 실제 로그인 세션이 필요 없으므로, 웹에서만
// AsyncStorage(localStorage)로 대체한다. 실제 보안이 필요한 네이티브에서는 그대로 SecureStore 사용.
const secureStorage = {
  getItem: (key: string) => (Platform.OS === 'web' ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key)),
  setItem: (key: string, value: string) =>
    Platform.OS === 'web' ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value),
  removeItem: (key: string) =>
    Platform.OS === 'web' ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key),
};

const PROFILE_KEYS = {
  profileUrl: 'profileUrl',
  nickname: 'nickname',
  region: 'region',
  notificationEnabled: 'notificationEnabled',
} as const;

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  /** epoch ms */
  accessTokenExpiresAt: number;
  accessTokenTtlMs: number;
};

export type AuthProfile = {
  profileUrl: string | null;
  nickname: string | null;
  region: string | null;
  notificationEnabled: boolean;
};

// 웹은 accessToken 만료 60초 전에 갱신한다 (ACCESS_TOKEN_REFRESH_BUFFER_MS)
export const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60_000;

export async function saveTokens(tokens: TokenPair): Promise<void> {
  await Promise.all([
    secureStorage.setItem(SECURE_KEYS.accessToken, tokens.accessToken),
    secureStorage.setItem(SECURE_KEYS.refreshToken, tokens.refreshToken),
    AsyncStorage.setItem('accessTokenExpiresAt', String(tokens.accessTokenExpiresAt)),
    AsyncStorage.setItem('accessTokenTtlMs', String(tokens.accessTokenTtlMs)),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return secureStorage.getItem(SECURE_KEYS.accessToken);
}

export async function getRefreshToken(): Promise<string | null> {
  return secureStorage.getItem(SECURE_KEYS.refreshToken);
}

export async function isAccessTokenExpiringSoon(): Promise<boolean> {
  const expiresAt = await AsyncStorage.getItem('accessTokenExpiresAt');
  if (!expiresAt) return true;
  return Number(expiresAt) - Date.now() <= ACCESS_TOKEN_REFRESH_BUFFER_MS;
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    secureStorage.removeItem(SECURE_KEYS.accessToken),
    secureStorage.removeItem(SECURE_KEYS.refreshToken),
    AsyncStorage.multiRemove(['accessTokenExpiresAt', 'accessTokenTtlMs']),
  ]);
}

export async function saveProfile(profile: AuthProfile): Promise<void> {
  await AsyncStorage.multiSet([
    [PROFILE_KEYS.profileUrl, profile.profileUrl ?? ''],
    [PROFILE_KEYS.nickname, profile.nickname ?? ''],
    [PROFILE_KEYS.region, profile.region ?? ''],
    [PROFILE_KEYS.notificationEnabled, String(profile.notificationEnabled)],
  ]);
}

export async function getProfile(): Promise<AuthProfile> {
  const entries = await AsyncStorage.multiGet(Object.values(PROFILE_KEYS));
  const values = Object.fromEntries(entries);
  return {
    profileUrl: values[PROFILE_KEYS.profileUrl] || null,
    nickname: values[PROFILE_KEYS.nickname] || null,
    region: values[PROFILE_KEYS.region] || null,
    notificationEnabled: values[PROFILE_KEYS.notificationEnabled] === 'true',
  };
}

export async function clearProfile(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(PROFILE_KEYS));
}
