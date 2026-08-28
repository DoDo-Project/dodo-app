import { apiClient } from './axios';

// 웹(dodo-frontend)의 MainPage(GET /main) 계약과 동일.

export type PetSpecies = 'CANINE' | 'FELINE';
export type PetSex = 'MALE' | 'FEMALE' | 'NEUTER';

export interface MainPetProfile {
  petId: number;
  name: string;
  imageFileUrl: string | null;
  breed: string;
  age: number;
  species: PetSpecies;
  sex: PetSex;
  weight: number;
}

export interface MainHealthReport {
  petId: number;
  petName: string;
  dashboardId: number;
  healthReportTitle: string;
  /** 실제 백엔드 필드명 미확인 — healthReportSummary로 추정 */
  healthReportSummary: string;
  /** JSON 문자열 · 실제 백엔드 필드명 미확인 — healthReportContent로 추정 */
  healthReportContent: string;
  checkupDate: string;
}

export interface MainResponse {
  petProfiles: MainPetProfile[];
  healthReports: MainHealthReport[];
  /** 웹에서도 화면에 렌더되지 않는 죽은 필드 — 공지사항 UI는 목데이터 사용 */
  announcement: unknown[];
}

export async function getMain(): Promise<MainResponse> {
  const response = await apiClient.get<MainResponse>('/main');
  return response.data;
}
