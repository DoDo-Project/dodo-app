import { apiClient } from './axios';
import type { PetSex, PetSpecies } from './mainApi';

export type { PetSex, PetSpecies };

// 웹(dodo-frontend)의 반려동물 도메인 계약과 동일.
// 주의: 체중 API만 단수형 /pet/, 나머지는 전부 복수형 /pets/ — 실제 백엔드 스펙이며 오타 아님.

// 실제 응답 확인됨 (2026-08-28): userId는 숫자가 아니라 UUID 문자열, 필드명도 userName/profileImageUrl
export interface FamilyMember {
  userId: string;
  userName: string;
  profileImageUrl: string | null;
}

export interface PetListItem {
  petId: number;
  name: string;
  imageFileUrl: string | null;
  breed: string;
  age: number;
  species: PetSpecies;
  sex: PetSex;
}

export interface GetPetsListResponse {
  pets: PetListItem[];
}

/** 내 반려동물 목록 (GET /pets/list) */
export async function getPetsList(page = 0, size = 10): Promise<GetPetsListResponse> {
  const response = await apiClient.get<GetPetsListResponse>('/pets/list', {
    params: { page, size, sort: 'registrationCreatedAt,desc' },
  });
  return response.data;
}

export interface PetActivity {
  measuredAt: string;
  [key: string]: unknown;
}

export interface PetDetail {
  petId: number;
  petName: string;
  imageFileUrl: string | null;
  species: PetSpecies;
  breed: string;
  sex: PetSex;
  age: number;
  birth: string;
  registrationNumber: string | null;
  deviceId: string;
  referenceHeartRate: number;
  familyMembers: FamilyMember[];
  lastActivity: PetActivity | null;
  specialNotes: SignificantNote[];
  specialNotesCount: number;
  weightInfo: unknown;
}

/** 반려동물 상세 (GET /pets/{petId}) */
export async function getPetDetail(petId: number | string): Promise<PetDetail> {
  const response = await apiClient.get<PetDetail>(`/pets/${petId}`);
  return response.data;
}

export interface CreatePetRequest {
  imageUrl: string;
  imageFileUrl: string;
  petName: string;
  species: PetSpecies;
  sex: PetSex;
  breed: string;
  /** "YYYY-MM-DDT00:00:00" */
  birth: string;
  age: number;
  registrationNumber?: string;
  referenceHeartRate: number;
  deviceId: string;
}

export interface CreatePetResponse {
  petId: number;
}

/** 반려동물 등록 (POST /pets) */
export async function createPet(body: CreatePetRequest): Promise<CreatePetResponse> {
  const response = await apiClient.post<CreatePetResponse>('/pets', body);
  return response.data;
}

export interface UpdatePetRequest {
  imageFileUrl: string;
  petName: string;
  species: PetSpecies;
  sex: PetSex;
  breed: string;
  birth: string;
  age: number;
  registrationNumber?: string;
  referenceHeartRate: number;
  deviceId: string;
}

/**
 * 반려동물 정보 수정 (PATCH /pets/{petId})
 * 웹은 species·birth를 폼에는 보여주면서 실제로는 전송하지 않는 버그가 있음 — RN에서는 정상적으로 포함해 전송한다.
 * 백엔드가 이 두 필드를 실제로 반영하는지는 로그인 복구 후 별도 확인 필요.
 */
export async function updatePet(petId: number | string, body: UpdatePetRequest): Promise<void> {
  await apiClient.patch(`/pets/${petId}`, body);
}

/** 가족 나가기 — "펫 삭제"가 아니라 내 가족 구성원 자격 해제 (POST /pets 하드삭제 엔드포인트는 존재하지 않음) */
export async function leavePetFamily(petId: number | string): Promise<void> {
  await apiClient.delete(`/pets/${petId}`);
}

export const NOTE_TYPES = ['ALLERGY', 'HOSPITAL', 'MEDICATION', 'FOOD', 'BEHAVIOR', 'SYMPTOM', 'ETC'] as const;
export type NoteType = (typeof NOTE_TYPES)[number];

export interface SignificantNote {
  noteId: number;
  petId: number;
  noteContent: string;
  noteType: NoteType;
  createdAt: string;
}

export interface GetSignificantNotesResponse {
  notes: SignificantNote[];
}

/** 특이사항 목록 (GET /pets/{petId}/significant) */
export async function getSignificantNotes(
  petId: number | string,
  page = 0,
  size = 10,
): Promise<GetSignificantNotesResponse> {
  const response = await apiClient.get<GetSignificantNotesResponse>(`/pets/${petId}/significant`, {
    params: { page, size, sort: 'createdAt,desc' },
  });
  return response.data;
}

/** 특이사항 추가 (POST /pets/significant) */
export async function createSignificantNote(petId: number, noteContent: string, noteType: NoteType): Promise<void> {
  await apiClient.post('/pets/significant', { petId, noteContent, noteType });
}

/** 특이사항 수정 (PATCH /pets/significant/{noteId}) — petId는 URL/body 어디에도 없음 */
export async function updateSignificantNote(
  noteId: number | string,
  noteContent: string,
  noteType: NoteType,
): Promise<void> {
  await apiClient.patch(`/pets/significant/${noteId}`, { noteContent, noteType });
}

/** 특이사항 삭제 (DELETE /pets/significant/{noteId}) */
export async function deleteSignificantNote(noteId: number | string): Promise<void> {
  await apiClient.delete(`/pets/significant/${noteId}`);
}

export interface WeightRecord {
  weightId: number;
  petId: number;
  weight: number;
  petWeightsMeasuredAt: string;
}

export interface GetWeightHistoryResponse {
  records: WeightRecord[];
}

/** 체중 이력 (GET /pet/{petId}/weight/history) — 경로가 단수형 /pet/ 임에 주의 */
export async function getWeightHistory(petId: number | string, page = 0, size = 15): Promise<GetWeightHistoryResponse> {
  const response = await apiClient.get<GetWeightHistoryResponse>(`/pet/${petId}/weight/history`, {
    params: { page, size, sort: 'petWeightsMeasuredAt,desc' },
  });
  return response.data;
}

/** 체중 기록 추가 (POST /pet/{petId}/weight) */
export async function createWeightRecord(
  petId: number | string,
  weight: number,
  petWeightsMeasuredAt: string,
): Promise<void> {
  await apiClient.post(`/pet/${petId}/weight`, { weight, petWeightsMeasuredAt });
}

/** 체중 기록 수정 (PATCH /pet/{petId}/weight/{weightId}) */
export async function updateWeightRecord(
  petId: number | string,
  weightId: number | string,
  body: { weight?: number; petWeightsMeasuredAt?: string },
): Promise<void> {
  await apiClient.patch(`/pet/${petId}/weight/${weightId}`, body);
}

/** 체중 기록 삭제 (DELETE /pet/{petId}/weight/{weightId}) */
export async function deleteWeightRecord(petId: number | string, weightId: number | string): Promise<void> {
  await apiClient.delete(`/pet/${petId}/weight/${weightId}`);
}
