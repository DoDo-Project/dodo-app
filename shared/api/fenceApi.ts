import { apiClient } from './axios';

// 웹(dodo-frontend)의 산책/지오펜스(울타리) 도메인 계약과 동일. 울타리는 원(중심+반경)만 지원, pet당 1개.

// dodo-frontend의 검증된 타입 기준(2026-08-28 재확인): center는 {lat,lng}가 아니라 {latitude,longitude}.
export interface FenceBoundary {
  fenceId: number;
  fenceName: string;
  center: { latitude: number; longitude: number };
  radius: number;
  isActive: boolean;
  petId: number;
  petName: string;
  petImageUrl: string | null;
}

export interface GetFenceBoundariesResponse {
  boundaries: FenceBoundary[];
}

/** 전체 울타리 목록 (GET /fence/boundaries) */
export async function getFenceBoundaries(): Promise<GetFenceBoundariesResponse> {
  const response = await apiClient.get<GetFenceBoundariesResponse>('/fence/boundaries');
  return response.data;
}

export interface CreateFenceRequest {
  petId: number;
  centerLatitude: number;
  centerLongitude: number;
  radius: number;
  fenceName: string;
}

export interface CreateFenceResponse {
  fenceId: number;
}

/** 울타리 생성 (POST /fence/range) — 선택 pet에 기존 울타리가 없을 때만 */
export async function createFence(body: CreateFenceRequest): Promise<CreateFenceResponse> {
  const response = await apiClient.post<CreateFenceResponse>('/fence/range', body);
  return response.data;
}

export interface UpdateFenceRequest {
  centerLatitude?: number;
  centerLongitude?: number;
  fenceName?: string;
  radius?: number;
}

/** 울타리 수정 (PATCH /fence/{fenceId}/range) — 슬라이더 조작은 즉시 반영 안 됨, 저장 버튼 눌러야 호출 */
export async function updateFence(fenceId: number | string, body: UpdateFenceRequest): Promise<void> {
  await apiClient.patch(`/fence/${fenceId}/range`, body);
}

/** 울타리 on/off 토글 (PATCH /fence/{fenceId}/toggle) */
export async function toggleFence(fenceId: number | string, fenceIsActive: boolean): Promise<void> {
  await apiClient.patch(`/fence/${fenceId}/toggle`, { fenceIsActive });
}
