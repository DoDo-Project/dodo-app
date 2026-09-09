import { apiClient } from './axios';

// 웹(dodo-frontend)의 사용자/계정 도메인(마이도도, 회원정보 수정, 알림설정, 탈퇴) 계약과 동일.

export interface UserMe {
  email: string;
  name: string;
  nickname: string;
  region: string;
  hasFamily: boolean;
  profileUrl: string | null;
  notificationEnabled: boolean;
  userCreatedAt: string;
}

/** 내 정보 조회 (GET /users/me) */
export async function getMe(): Promise<UserMe> {
  const response = await apiClient.get<UserMe>('/users/me');
  return response.data;
}

export interface CheckNicknameResponse {
  message: string;
  nickname: string;
  duplicated: boolean;
}

/** 닉네임 중복 확인 (GET /users/nickname/check) — 회원가입 중엔 registrationToken 헤더로 호출 */
export async function checkNickname(nickname: string, registrationToken?: string): Promise<CheckNicknameResponse> {
  const response = await apiClient.get<CheckNicknameResponse>('/users/nickname/check', {
    params: { nickname },
    headers: registrationToken ? { Authorization: `Bearer ${registrationToken}` } : undefined,
  });
  return response.data;
}

export interface UpdateMeRequest {
  nickname: string;
  region: string;
  hasFamily: boolean;
  profileUrl?: string | null;
}

/** 회원정보 수정 (PATCH /users/me) — 이메일/이름은 읽기전용, hasFamily는 기존값 그대로 전송 */
export async function updateMe(body: UpdateMeRequest): Promise<void> {
  await apiClient.patch('/users/me', body);
}

/** 알림 설정 (PATCH /users/me/setting/notification) — notificationEnabled 단일 boolean만 존재 */
export async function updateNotificationSetting(notificationEnabled: boolean): Promise<{ message: string }> {
  const response = await apiClient.patch<{ message: string }>('/users/me/setting/notification', {
    notificationEnabled,
  });
  return response.data;
}

/** 탈퇴 인증 메일 발송 (POST /users/me/withdrawal/email) — 60초 쿨다운, 서버도 1분 내 재요청 시 429 */
export async function sendWithdrawalEmail(): Promise<void> {
  await apiClient.post('/users/me/withdrawal/email');
}

/** 회원 탈퇴 (DELETE /users/me) */
export async function withdrawUser(authCode: string): Promise<void> {
  await apiClient.delete('/users/me', { data: { authCode } });
}
