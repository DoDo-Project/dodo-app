/** 커뮤니티 목록에서 쓰는 짧은 날짜 표기 (예: "6월 12일") */
export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/** 초 단위 경과 시간을 mm:ss 또는 h:mm:ss로 표기 (산책 타이머용) */
export function formatDurationSeconds(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** 시작~종료 시각 문자열로부터 경과 시간(초)을 계산 */
export function durationSecondsBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.round((end - start) / 1000));
}

/** 게시글 상세에서 쓰는 전체 날짜/시간 표기 (예: "2026. 06. 12. 오후 07:33") */
export function formatFullDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hours24 = date.getHours();
  const period = hours24 < 12 ? '오전' : '오후';
  const hours12 = String(hours24 % 12 === 0 ? 12 : hours24 % 12).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${y}. ${m}. ${d}. ${period} ${hours12}:${minutes}`;
}
