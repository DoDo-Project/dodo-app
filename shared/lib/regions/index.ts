import { REGIONS_BY_SIDO } from './data';

/** 시/도 목록 (17개) */
export const SIDO_LIST = Object.keys(REGIONS_BY_SIDO);

/** 선택한 시/도의 시/군/구 목록. 세종 등은 빈 배열 */
export function getSigunguList(sido: string): string[] {
  return REGIONS_BY_SIDO[sido] ?? [];
}

/** 시/도 + 시/군/구 → API 전송용 문자열 (예: 서울특별시 동대문구) */
export function formatRegionLabel(sido: string, sigungu: string | null): string {
  if (!sigungu) return sido;
  return `${sido} ${sigungu}`;
}

/** 저장된 region 문자열 → 선택 상태로 분해 */
export function parseRegionLabel(region: string): { sido: string; sigungu: string | null } {
  const trimmed = region.trim();
  if (!trimmed) return { sido: '', sigungu: null };

  for (const sido of SIDO_LIST) {
    if (trimmed === sido) return { sido, sigungu: null };
    if (trimmed.startsWith(`${sido} `)) {
      return { sido, sigungu: trimmed.slice(sido.length + 1) };
    }
  }

  return { sido: '', sigungu: null };
}

export function hasSigunguOptions(sido: string): boolean {
  return getSigunguList(sido).length > 0;
}
