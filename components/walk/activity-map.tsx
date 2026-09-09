import { NaverMapMarkerOverlay, NaverMapPolylineOverlay, NaverMapView } from '@mj-studio/react-native-naver-map';
import { StyleSheet } from 'react-native';

import { DodoColors } from '@/constants/theme';

type Coord = { latitude: number; longitude: number };

type Props = {
  center: Coord;
  points: Coord[];
  currentLocation?: Coord | null;
  startPoint?: Coord | null;
};

export function ActivityMap({ center, points, currentLocation, startPoint }: Props) {
  return (
    <NaverMapView
      style={styles.map}
      camera={{ latitude: center.latitude, longitude: center.longitude, zoom: 17 }}
      animationDuration={300}
    >
      {points.length > 1 && <NaverMapPolylineOverlay coords={points} width={5} color={DodoColors.brand} />}
      {startPoint && (
        <NaverMapMarkerOverlay
          latitude={startPoint.latitude}
          longitude={startPoint.longitude}
          image={{ symbol: 'green' }}
          width={22}
          height={30}
          caption={{ text: '출발', textSize: 11 }}
        />
      )}
      {currentLocation && (
        <NaverMapMarkerOverlay
          latitude={currentLocation.latitude}
          longitude={currentLocation.longitude}
          image={{ symbol: 'red' }}
          width={22}
          height={30}
        />
      )}
    </NaverMapView>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 280,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
