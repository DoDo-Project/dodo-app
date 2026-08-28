import { apiClient } from './axios';

// 활동 기록(산책) 도메인. 웹에는 없던 신규 기능 — API 명세(Activity History API) 기준으로 작성.
// 상태 흐름: BEFORE(대기) --start--> IN_PROGRESS(진행중) --finish--> COMPLETED(완료)
//                       IN_PROGRESS --cancel--> CANCELED(중단) --start(재개)--> IN_PROGRESS

export type ActivityType = 'WALKING' | 'SLEEPING';
export type ActivityHistoryStatus = 'BEFORE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';

export interface ActivityPetSummary {
  id: number;
  name: string;
  age?: number;
  profileImageUrl?: string | null;
}

export interface ActivityHistoryListItem {
  historyId: number;
  activityType: ActivityType;
  distance: number;
  activityHistoryStartAt: string;
  activityHistoryEndAt: string | null;
  activityHistoryStatus: ActivityHistoryStatus;
  reactionCount: number;
  heartAverage: number | null;
  pet: ActivityPetSummary;
}

export interface GetActivityHistoryResponse {
  message: string;
  histories: ActivityHistoryListItem[];
}

/** 내 활동 기록 조회 (GET /activities/history) */
export async function getActivityHistory(
  page = 0,
  size = 10,
  sort = 'activityHistoryStartAt,desc',
): Promise<GetActivityHistoryResponse> {
  const response = await apiClient.get<GetActivityHistoryResponse>('/activities/history', {
    params: { page, size, sort },
  });
  return response.data;
}

export interface CreateActivityRequest {
  petId: number;
  activityType: ActivityType;
}

export interface CreateActivityResponse {
  message: string;
  historyId: number;
  activityType: ActivityType;
}

/** 활동 기록 생성 (POST /activities/history) — 초기 상태 BEFORE. 진행 중인 기록이 있으면 409 */
export async function createActivityHistory(body: CreateActivityRequest): Promise<CreateActivityResponse> {
  const response = await apiClient.post<CreateActivityResponse>('/activities/history', body);
  return response.data;
}

export interface StartActivityRequest {
  startLatitude: number;
  startLongitude: number;
}

/** 활동 시작/재개 (PATCH /activities/history/{historyId}/start) — BEFORE|CANCELED → IN_PROGRESS */
export async function startActivityHistory(
  historyId: number | string,
  body: StartActivityRequest,
): Promise<{ message: string }> {
  const response = await apiClient.patch<{ message: string }>(`/activities/history/${historyId}/start`, body);
  return response.data;
}

export interface FinishActivityResponse {
  message: string;
  historyId: number;
  activityType: ActivityType;
  distance: number;
  activityHistoryStartAt: string;
  activityHistoryEndAt: string;
}

/** 활동 종료 (PATCH /activities/history/{historyId}/finish) — IN_PROGRESS → COMPLETED */
export async function finishActivityHistory(historyId: number | string): Promise<FinishActivityResponse> {
  const response = await apiClient.patch<FinishActivityResponse>(`/activities/history/${historyId}/finish`);
  return response.data;
}

/** 활동 취소/일시정지 (PATCH /activities/history/{historyId}/cancel) — IN_PROGRESS → CANCELED */
export async function cancelActivityHistory(historyId: number | string): Promise<{ message: string }> {
  const response = await apiClient.patch<{ message: string }>(`/activities/history/${historyId}/cancel`);
  return response.data;
}

export interface PetActivityStatusResponse {
  message: string;
  historyId?: number;
}

export type InferredActivityStatus = 'IN_PROGRESS' | 'BEFORE' | 'CANCELED' | 'NONE';

/**
 * 반려동물 활동 상태 조회 (GET /activities/history/{petId}/status)
 * 응답에 상태 enum이 따로 없고 message 문구로만 상태를 구분해야 해서, 문구 기반으로 상태를 추론한다.
 * 백엔드가 문구를 바꾸면 이 추론이 깨질 수 있음 — 실제 연동 후 문구 재확인 필요.
 */
export function inferActivityStatus(message: string): InferredActivityStatus {
  if (message.includes('기록중')) return 'IN_PROGRESS';
  if (message.includes('중단')) return 'CANCELED';
  if (message.includes('시작 전')) return 'BEFORE';
  return 'NONE';
}

export async function getPetActivityStatus(petId: number | string): Promise<PetActivityStatusResponse> {
  const response = await apiClient.get<PetActivityStatusResponse>(`/activities/history/${petId}/status`);
  return response.data;
}

export interface ActivityHistoryDetail {
  message: string;
  historyId: number;
  petId: number;
  distance: number;
  activityHistoryStartAt: string;
  activityHistoryEndAt: string | null;
  startLatitude: number;
  startLongitude: number;
  reactionCount: number;
  isLikedByMe: boolean;
}

/** 활동 상세 정보 조회 (GET /activities/history/{historyId}) */
export async function getActivityHistoryDetail(historyId: number | string): Promise<ActivityHistoryDetail> {
  const response = await apiClient.get<ActivityHistoryDetail>(`/activities/history/${historyId}`);
  return response.data;
}

/** 활동 기록 삭제 (DELETE /activities/history/{historyId}) */
export async function deleteActivityHistory(historyId: number | string): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(`/activities/history/${historyId}`);
  return response.data;
}

export interface RoutePoint {
  routePointId: number;
  latitude: number;
  longitude: number;
  measuredAt?: string;
}

export interface ActivityRouteResponse {
  message: string;
  historyId: number;
  activityType: ActivityType;
  distance: number;
  activityHistoryStartAt: string;
  activityHistoryEndAt: string | null;
  startLatitude: number;
  startLongitude: number;
  activityHistoryStatus: ActivityHistoryStatus;
  routePoints: RoutePoint[];
}

/** 활동 상세 경로 조회 (GET /activities/history/{historyId}/route) */
export async function getActivityRoute(historyId: number | string): Promise<ActivityRouteResponse> {
  const response = await apiClient.get<ActivityRouteResponse>(`/activities/history/${historyId}/route`);
  return response.data;
}

export type PopularReactionType = 'LIKE' | 'DISLIKE';

export interface GetPopularActivitiesParams {
  latitude: number;
  longitude: number;
  reactionType: PopularReactionType;
  limit?: number;
  cursor?: number;
}

export interface GetPopularActivitiesResponse {
  message: string;
  histories: ActivityHistoryListItem[];
}

/**
 * 주변 인기 활동 조회 (GET /activities/history/popular)
 * 커서 기반 페이지네이션 — 다음 페이지 cursor는 마지막 항목의 historyId를 사용한다고 가정
 * (응답에 별도 nextCursor 필드가 명세에 없어 이렇게 추정, 실제 응답 확인 후 조정 필요)
 */
export async function getPopularActivities(params: GetPopularActivitiesParams): Promise<GetPopularActivitiesResponse> {
  const response = await apiClient.get<GetPopularActivitiesResponse>('/activities/history/popular', { params });
  return response.data;
}
