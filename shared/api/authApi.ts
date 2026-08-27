import { apiClient } from './axios';
import type { SocialProvider } from '@/shared/lib/auth/oauth';

// 웹(dodo-frontend)의 features/auth/api/auth.ts, model/types.ts와 동일한 계약.

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** 밀리초 (소셜 로그인/가입 응답 기준) */
  accessTokenExpiresIn: number;
}

export interface SocialLoginSuccess extends AuthTokens {
  profileUrl: string;
}

export interface SocialSignupRequired {
  email: string;
  name: string;
  profileUrl?: string;
  /** 가입 완료(PUT /users/me/profile) 시 Authorization 헤더로 전달하는 임시 토큰 */
  registrationToken: string;
  /** 임시 토큰 만료까지 남은 시간(ms) */
  tokenExpiresIn: number;
}

export type SocialLoginResult =
  | { kind: 'LOGIN'; data: SocialLoginSuccess }
  | { kind: 'SIGNUP_REQUIRED'; data: SocialSignupRequired };

const SIGNUP_REQUIRED_STATUS = 202;

/**
 * 소셜 로그인 (POST /auth/social-login)
 * - 200: 기존 회원 → 토큰 발급 (kind: 'LOGIN')
 * - 202: 신규 사용자 → registrationToken 발급, 추가 정보 입력 필요 (kind: 'SIGNUP_REQUIRED')
 */
export async function socialLogin(provider: SocialProvider, code: string): Promise<SocialLoginResult> {
  const response = await apiClient.post<SocialLoginSuccess | SocialSignupRequired>(
    '/auth/social-login',
    { provider, code },
    { skipAuthAttach: true, skipAuthRefresh: true },
  );

  if (response.status === SIGNUP_REQUIRED_STATUS) {
    return { kind: 'SIGNUP_REQUIRED', data: response.data as SocialSignupRequired };
  }

  return { kind: 'LOGIN', data: response.data as SocialLoginSuccess };
}

export interface LogoutResponse {
  message: string;
}

/**
 * 로그아웃 (POST /auth/logout)
 * accessToken은 apiClient 인터셉터가 Authorization 헤더로 자동 첨부한다.
 */
export async function logout(refreshToken: string): Promise<LogoutResponse> {
  const response = await apiClient.post<LogoutResponse>('/auth/logout', { refreshToken });
  return response.data;
}
