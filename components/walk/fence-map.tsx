import { NaverMapCircleOverlay, NaverMapView } from '@mj-studio/react-native-naver-map';

import { DodoColors } from '@/constants/theme';

import type { PetFence } from './fence-settings-screen';
import { styles } from './fence-settings-screen';

type Props = {
  selectedFence: PetFence;
  fences: PetFence[];
};

export function FenceMap({ selectedFence, fences }: Props) {
  return (
    <NaverMapView
      style={styles.map}
      camera={{ latitude: selectedFence.latitude, longitude: selectedFence.longitude, zoom: 14 }}
      animationDuration={300}
    >
      {fences.map((fence) => {
        const selected = fence.petId === selectedFence.petId;
        return (
          <NaverMapCircleOverlay
            key={fence.petId}
            latitude={fence.latitude}
            longitude={fence.longitude}
            radius={fence.radiusMeters}
            color={selected ? 'rgba(34,197,94,0.25)' : 'rgba(107,114,128,0.12)'}
            outlineWidth={selected ? 2 : 1}
            outlineColor={selected ? DodoColors.fenceInside : DodoColors.fenceIdleLabel}
          />
        );
      })}
    </NaverMapView>
  );
}
