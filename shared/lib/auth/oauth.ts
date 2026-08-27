import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { env } from '@/shared/config/env';

// 웹(dodo-frontend)의 features/auth/lib/oauth.ts와 동일한 방식.
// 앱이 직접 구글/네이버 인가 서버로 이동하고, 돌아온 인가 코드(code)를 백엔드
// POST /auth/social-login 으로 넘겨 토큰을 발급받는다 (백엔드가 OAuth를 대행하지 않음).
export type SocialProvider = 'GOOGLE' | 'NAVER';

interface ProviderOAuthConfig {
  authorizeUrl: string;
  clientId: string;
  scope?: string;
}

const PROVIDER_OAUTH: Record<SocialProvider, ProviderOAuthConfig> = {
  GOOGLE: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: env.GOOGLE_CLIENT_ID,
    scope: 'openid email profile',
  },
  NAVER: {
    authorizeUrl: 'https://nid.naver.com/oauth2.0/authorize',
    clientId: env.NAVER_CLIENT_ID,
  },
};

export type SocialAuthCodeResult =
  | { success: true; code: string }
  | { success: false; reason: 'cancelled' | 'error' | 'state_mismatch' };

/**
 * 구글/네이버 로그인 화면을 열고, 돌아온 인가 코드(code)를 반환한다.
 * 코드를 실제 토큰으로 교환하는 건 shared/api/authApi.ts의 socialLogin()이 담당.
 */
export async function requestSocialAuthCode(provider: SocialProvider): Promise<SocialAuthCodeResult> {
  const config = PROVIDER_OAUTH[provider];
  const redirectUri = Linking.createURL(`auth/callback/${provider.toLowerCase()}`);
  const state = Crypto.randomUUID();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: redirectUri,
    state,
  });
  if (config.scope) {
    params.set('scope', config.scope);
  }

  const authorizeUrl = `${config.authorizeUrl}?${params.toString()}`;
  const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, redirectUri);

  if (result.type !== 'success' || !result.url) {
    return { success: false, reason: result.type === 'cancel' || result.type === 'dismiss' ? 'cancelled' : 'error' };
  }

  const callbackUrl = new URL(result.url);
  const returnedState = callbackUrl.searchParams.get('state');
  const code = callbackUrl.searchParams.get('code');

  if (returnedState !== state) {
    throw new Error('OAuth state mismatch — 위조된 콜백일 수 있어 로그인을 중단합니다.');
  }
  if (!code) {
    return { success: false, reason: 'error' };
  }

  return { success: true, code };
}
