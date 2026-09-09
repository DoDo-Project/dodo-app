import { useStompTopic } from './useStompTopic';

// 웹(dodo-frontend)과 동일한 STOMP 계약. 위치 수신 전용 — publish는 없음.
// petId를 선택하는 즉시 연결하고, petId가 바뀌면 기존 client를 deactivate() 한 뒤 새로 만든다.

export interface FenceLocationPayload {
  petId: number;
  latitude: number;
  longitude: number;
  measuredAt: string;
  insideFence: boolean;
  distanceMeter: number;
  radius: number;
  message?: string;
}

export function useFenceLocationSocket(petId: number | string | null): FenceLocationPayload | null {
  return useStompTopic<FenceLocationPayload>(petId != null ? `/sub/fence/location/${petId}` : null);
}
