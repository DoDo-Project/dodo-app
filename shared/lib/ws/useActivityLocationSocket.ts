import { useStompTopic } from './useStompTopic';

// 산책 활동(activities/history) 실시간 경로 — historyId 단위로 구독한다 (펫 단위인 울타리 채널과 별개).
// 백엔드 확인된 계약(2026-08-28): 구독 경로 /sub/activities/history/routes/{historyId}
// 수신 payload: { routePointId, latitude, longitude, measuredAt }

export interface ActivityRoutePoint {
  routePointId: number;
  latitude: number;
  longitude: number;
  measuredAt: string;
}

export function useActivityLocationSocket(historyId: number | string | null): ActivityRoutePoint | null {
  return useStompTopic<ActivityRoutePoint>(historyId != null ? `/sub/activities/history/routes/${historyId}` : null);
}
