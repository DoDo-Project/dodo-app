import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { env } from '@/shared/config/env';

// 웹(dodo-frontend)의 features/auth/lib/oauth.ts와 동일한 방식으로, 돌아온 인가 코드(code)를
// 백엔드 POST /auth/social-login 으로 넘겨 토큰을 발급받는다 (백엔드가 OAuth를 대행하지 않음).
//
// Google/Naver 모두 자기 OAuth 서버의 redirect_uri로 커스텀 스킴(dodoapp://)을 직접 받는 걸
// 정책상 허용하지 않는다 (특히 Android — https://developers.google.com/identity/protocols/oauth2/native-app).
// 그래서 redirect_uri는 웹과 동일한 HTTPS 주소(env.OAUTH_REDIRECT_URI)를 그대로 쓰고, state에
// 'app_' 접두사를 붙여 이 요청이 앱에서 온 것임을 표시한다. dodo-frontend의 AuthCallbackPage가
// 이 접두사를 보고 dodoapp://auth/callback/{provider}로 다시 리다이렉트해준다 — 이 리다이렉트는
// 우리 웹페이지가 하는 것이라 Google/Naver의 정책과 무관하다.
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
 * 구글/네이버 로그인을 수행하고, 돌아온 인가 코드(code)를 반환한다.
 * 코드를 실제 토큰으로 교환하는 건 shared/api/authApi.ts의 socialLogin()이 담당.
 */
export async function requestSocialAuthCode(provider: SocialProvider): Promise<SocialAuthCodeResult> {
  const config = PROVIDER_OAUTH[provider];
  const providerPath = provider.toLowerCase();

  const appRedirectUri = Linking.createURL(`auth/callback/${providerPath}`);
  const webRedirectUri = `${env.OAUTH_REDIRECT_URI}/${providerPath}`;
  const state = `app_${Crypto.randomUUID()}`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: webRedirectUri,
    state,
  });
  if (config.scope) {
    params.set('scope', config.scope);
  }

  const authorizeUrl = `${config.authorizeUrl}?${params.toString()}`;
  const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, appRedirectUri);

  if (result.type !== 'success' || !result.url) {
    return { success: false, reason: result.type === 'cancel' || result.type === 'dismiss' ? 'cancelled' : 'error' };
  }

  const callbackUrl = new URL(result.url);
  const returnedState = callbackUrl.searchParams.get('state');
  const code = callbackUrl.searchParams.get('code');
  const oauthError = callbackUrl.searchParams.get('error');

  if (returnedState !== state) {
    throw new Error('OAuth state mismatch — 위조된 콜백일 수 있어 로그인을 중단합니다.');
  }
  if (oauthError) {
    return { success: false, reason: oauthError === 'access_denied' ? 'cancelled' : 'error' };
  }
  if (!code) {
    return { success: false, reason: 'error' };
  }

  return { success: true, code };
}
