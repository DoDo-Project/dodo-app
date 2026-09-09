import axios from 'axios';

import { apiConfig } from '@/shared/config';

import { useAuthStore } from './authStore';
import * as tokenStorage from './tokenStorage';

// 웹(dodo-frontend)의 shared/lib/auth/refreshSession.ts와 동일한 계약.
interface ReissueResponse {
  accessToken: string;
  refreshToken: string;
  /** OpenAPI 기준 초 단위 — ms로 변환해서 저장 */
  accessTokenExpiresIn: number;
}

async function requestReissue(refreshToken: string): Promise<ReissueResponse> {
  const { data } = await axios.post<ReissueResponse>(
    `${apiConfig.baseURL}/auth/reissue`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' }, timeout: apiConfig.timeout },
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
    const result = await requestReissue(refreshToken);
    const accessTokenTtlMs = result.accessTokenExpiresIn * 1000;
    await tokenStorage.saveTokens({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
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
