import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { apiConfig } from '@/shared/config';

import type { TokenPair } from './tokenStorage';

export type SocialProvider = 'google' | 'naver';

export type SocialLoginResult =
  | { success: true; tokens: TokenPair }
  | { success: false; reason: 'cancelled' | 'error' };

/**
 * TODO(백엔드 협의 필요): 정확한 OAuth 시작 엔드포인트/파라미터명 미확정.
 * 아래는 Spring Security OAuth2 Client 기본 컨벤션(`/oauth2/authorization/{provider}`)을
 * 가정한 값이며, 콜백에 accessToken/refreshToken/accessTokenTtlMs를 쿼리 파라미터로
 * 실어 돌려준다고 가정한다. 웹의 buildSocialAuthUrl()과 실제 스펙을 맞춰야 한다.
 * 딥링크(dodoapp://auth/callback/{provider})는 Google/Naver 콘솔 + 백엔드 양쪽에
 * 등록되어 있어야 정상 동작한다 (docs/DODO_RN_PORTING_SPEC.md §5 참고).
 */
function buildAuthorizeUrl(provider: SocialProvider, redirectUri: string, state: string): string {
  const url = new URL(`${apiConfig.baseURL}/oauth2/authorization/${provider}`);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  return url.toString();
}

export async function startSocialLogin(provider: SocialProvider): Promise<SocialLoginResult> {
  const redirectUri = Linking.createURL(`auth/callback/${provider}`);
  // 웹의 CSRF state 검증(sessionStorage에 저장 후 콜백에서 비교)과 동일한 목적
  const state = Crypto.randomUUID();
  const authorizeUrl = buildAuthorizeUrl(provider, redirectUri, state);

  const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, redirectUri);

  if (result.type !== 'success' || !result.url) {
    return { success: false, reason: result.type === 'cancel' || result.type === 'dismiss' ? 'cancelled' : 'error' };
  }

  const callbackUrl = new URL(result.url);
  const returnedState = callbackUrl.searchParams.get('state');
  if (returnedState !== state) {
    throw new Error('OAuth state mismatch — 위조된 콜백일 수 있어 로그인을 중단합니다.');
  }

  const accessToken = callbackUrl.searchParams.get('accessToken');
  const refreshToken = callbackUrl.searchParams.get('refreshToken');
  const accessTokenTtlMs = Number(callbackUrl.searchParams.get('accessTokenTtlMs') ?? 0);

  if (!accessToken || !refreshToken) {
    throw new Error('로그인 콜백에 토큰이 없습니다. 백엔드 redirect_uri 파라미터 스펙을 확인하세요.');
  }

  return {
    success: true,
    tokens: {
      accessToken,
      refreshToken,
      accessTokenTtlMs,
      accessTokenExpiresAt: Date.now() + accessTokenTtlMs,
    },
  };
}
