import axios from 'axios';

import { apiConfig } from '@/shared/config';

import { useAuthStore } from './authStore';
import * as tokenStorage from './tokenStorage';

/**
 * TODO(백엔드 협의 필요): 정확한 리프레시 엔드포인트/요청·응답 필드명 미확정.
 * 아래는 { refreshToken } 요청 → { accessToken, refreshToken, accessTokenTtlMs } 응답을
 * 가정한 값이며, 실제 스펙 확인 후 수정해야 한다.
 */
async function requestNewAccessToken(refreshToken: string) {
  const { data } = await axios.post<{ accessToken: string; refreshToken?: string; accessTokenTtlMs: number }>(
    `${apiConfig.baseURL}/auth/refresh`,
    { refreshToken },
  );
  return data;
}

// 동시에 여러 요청이 401을 받아도 리프레시 호출은 한 번만 나가도록 in-flight promise를 공유한다.
let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function performRefresh(): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const result = await requestNewAccessToken(refreshToken);
    const accessTokenTtlMs = result.accessTokenTtlMs;
    await tokenStorage.saveTokens({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken ?? refreshToken,
      accessTokenTtlMs,
      accessTokenExpiresAt: Date.now() + accessTokenTtlMs,
    });
    return result.accessToken;
  } catch {
    // 리프레시 실패 = 재로그인 필요. 세션을 지워서 화면단에서 로그인 상태로 전환되게 한다.
    await useAuthStore.getState().clearSession();
    return null;
  }
}
