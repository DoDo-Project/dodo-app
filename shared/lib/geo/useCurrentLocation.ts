import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

type Coord = { latitude: number; longitude: number };

/** 사용자(폰) 실제 GPS 위치. 권한이 없거나 조회 실패 시 null — 호출부에서 기본 좌표로 대체할 것. */
export function useCurrentLocation(): Coord | null {
  const [location, setLocation] = useState<Coord | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(
        () => null,
      );
      if (!cancelled && position) {
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return location;
}
