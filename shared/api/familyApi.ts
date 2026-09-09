import { apiClient } from './axios';

// 웹(dodo-frontend)의 가족 초대/신청/차단 도메인 계약과 동일.
// 주의: pending-users/blocked-users/applications는 서버 필터가 없어 전체를 받아 클라이언트에서 petId로 필터링해야 한다.

export type FamilyApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';

// userId는 UUID 문자열, 필드명 userName/profileImageUrl — GET /pets/{petId}의 familyMembers 응답으로 확인됨(2026-08-28).
// 이 엔드포인트 자체는 실응답 미확인이라 같은 백엔드 컨벤션으로 추정 적용 — 다를 경우 재확인 필요.
export interface PendingUser {
  userId: string;
  userName: string;
  profileImageUrl: string | null;
  petId: number;
  petName: string;
  status: FamilyApplicationStatus;
  appliedAt: string;
}

export interface GetPendingUsersResponse {
  users: PendingUser[];
}

/** 받은 가족 신청 목록 — petId 서버 필터 없음 (GET /pets/family/pending-users) */
export async function getPendingUsers(
  status?: FamilyApplicationStatus,
  page = 0,
  size = 20,
): Promise<GetPendingUsersResponse> {
  const response = await apiClient.get<GetPendingUsersResponse>('/pets/family/pending-users', {
    params: { status, page, size },
  });
  return response.data;
}

export interface BlockedUser {
  userId: string;
  userName: string;
  petId: number;
  petName: string;
}

export interface GetBlockedUsersResponse {
  users: BlockedUser[];
}

/** 차단 목록 — petId 서버 필터 없음 (GET /pets/family/blocked-users) */
export async function getBlockedUsers(page = 0, size = 20): Promise<GetBlockedUsersResponse> {
  const response = await apiClient.get<GetBlockedUsersResponse>('/pets/family/blocked-users', {
    params: { page, size },
  });
  return response.data;
}

export interface InvitationCodeResponse {
  code: string;
  /** 초 단위로 추정 — 웹은 이 값을 그대로 localStorage 캐시 TTL로 사용 */
  expiresIn: number;
}

/** 초대 코드 발급/재생성 (POST /pets/{petId}/invitation-code) — "현재 코드 조회" API는 없음, 로컬 캐시 필수 */
export async function createInvitationCode(petId: number | string): Promise<InvitationCodeResponse> {
  const response = await apiClient.post<InvitationCodeResponse>(`/pets/${petId}/invitation-code`);
  return response.data;
}

export interface JoinFamilyResponse {
  petId: number;
  message: string;
}

/** 초대코드로 가족 참여/신청 (POST /pets/family) — 6자리 영문대문자+숫자 코드 */
export async function joinFamily(code: string): Promise<JoinFamilyResponse> {
  const response = await apiClient.post<JoinFamilyResponse>('/pets/family', { code });
  return response.data;
}

export interface FamilyApplication {
  applicationId: number;
  petId: number;
  petName: string;
  status: FamilyApplicationStatus;
  appliedAt: string;
}

export interface GetFamilyApplicationsResponse {
  applications: FamilyApplication[];
}

/** 내가 보낸 가족 신청 목록 (GET /pets/family/applications) */
export async function getFamilyApplications(
  status?: FamilyApplicationStatus,
  page = 0,
  size = 20,
): Promise<GetFamilyApplicationsResponse> {
  const response = await apiClient.get<GetFamilyApplicationsResponse>('/pets/family/applications', {
    params: { status, page, size },
  });
  return response.data;
}

export type FamilyApprovalAction = 'APPROVED' | 'REJECTED' | 'BLOCKED';

/** 가족 신청 승인/거절/차단 (POST /pets/family/approval) */
export async function approveFamilyApplication(
  petId: number,
  targetUserId: string,
  action: FamilyApprovalAction,
): Promise<void> {
  await apiClient.post('/pets/family/approval', { petId, targetUserId, action });
}

/** 차단 해제 (DELETE /pets/family/block) — DELETE 요청 body 사용 */
export async function unblockFamilyUser(petId: number, targetUserId: string): Promise<void> {
  await apiClient.delete('/pets/family/block', { data: { petId, targetUserId } });
}
