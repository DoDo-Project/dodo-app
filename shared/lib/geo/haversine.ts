const EARTH_RADIUS_M = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 두 좌표 사이 거리(미터). 실시간 산책 경로의 클라이언트 측 거리 누적 계산용. */
export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 경로 포인트 배열의 총 이동 거리(미터) */
export function totalRouteDistanceMeters(points: { latitude: number; longitude: number }[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += distanceMeters(points[i - 1], points[i]);
  }
  return total;
}
