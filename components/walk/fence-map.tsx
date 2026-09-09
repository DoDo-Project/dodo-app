import { NaverMapCircleOverlay, NaverMapMarkerOverlay, NaverMapView } from '@mj-studio/react-native-naver-map';

import { DodoColors } from '@/constants/theme';

import type { Fence } from './fence-settings-screen';
import { styles } from './fence-settings-screen';
import type { FenceLocationPayload } from '@/shared/lib/ws/useFenceLocationSocket';

type Coord = { latitude: number; longitude: number };

type Props = {
  center: Coord;
  fences: Fence[];
  selectedPetId: number | null;
  liveLocation: FenceLocationPayload | null;
  pendingCenter: Coord | null;
  pendingRadius: number | null;
  onTapMap: (coord: Coord) => void;
};

export function FenceMap({
  center,
  fences,
  selectedPetId,
  liveLocation,
  pendingCenter,
  pendingRadius,
  onTapMap,
}: Props) {
  return (
    <NaverMapView
      style={styles.map}
      camera={{ latitude: center.latitude, longitude: center.longitude, zoom: 14 }}
      animationDuration={300}
      onTapMap={({ latitude, longitude }) => onTapMap({ latitude, longitude })}
    >
      {fences.map((fence) => {
        const selected = fence.petId === selectedPetId;
        // 미사용 울타리는 선택 여부와 무관하게 항상 회색으로 표시 — active 상태가 색상의 1순위 기준
        if (!fence.active) {
          return (
            <NaverMapCircleOverlay
              key={fence.fenceId}
              latitude={fence.latitude}
              longitude={fence.longitude}
              radius={fence.radiusMeters}
              color="rgba(107,114,128,0.12)"
              outlineWidth={selected ? 2 : 1}
              outlineColor={DodoColors.fenceIdleLabel}
            />
          );
        }
        return (
          <NaverMapCircleOverlay
            key={fence.fenceId}
            latitude={fence.latitude}
            longitude={fence.longitude}
            radius={fence.radiusMeters}
            color={selected ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.12)'}
            outlineWidth={selected ? 2 : 1}
            outlineColor={DodoColors.fenceInside}
          />
        );
      })}

      {pendingCenter && (
        <NaverMapCircleOverlay
          latitude={pendingCenter.latitude}
          longitude={pendingCenter.longitude}
          radius={pendingRadius ?? 200}
          color="rgba(249,115,22,0.18)"
          outlineWidth={2}
          outlineColor="#f97316"
        />
      )}
      {pendingCenter && (
        <NaverMapMarkerOverlay
          latitude={pendingCenter.latitude}
          longitude={pendingCenter.longitude}
          image={{ symbol: 'green' }}
        />
      )}

      {liveLocation && (
        <NaverMapMarkerOverlay
          latitude={liveLocation.latitude}
          longitude={liveLocation.longitude}
          image={{ symbol: 'red' }}
          caption={{ text: '실시간 위치' }}
        />
      )}
    </NaverMapView>
  );
}
