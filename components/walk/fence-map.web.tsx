import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { DodoColors } from '@/constants/theme';

import type { Fence } from './fence-settings-screen';
import { styles as screenStyles } from './fence-settings-screen';
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

// 네이버 지도 SDK는 네이티브 전용 모듈이라 react-native-web에서 렌더링이 불가능하다.
// 웹 프리뷰에서는 안내 플레이스홀더만 보여주고, 실제 지도는 Android/iOS 빌드에서 확인한다.
export function FenceMap({ fences, selectedPetId }: Props) {
  const selectedFence = fences.find((f) => f.petId === selectedPetId);
  return (
    <View style={[screenStyles.map, styles.placeholder]}>
      <Ionicons name="map-outline" size={36} color={DodoColors.fenceIdleLabel} />
      <Text style={styles.placeholderText}>네이버 지도는 웹 프리뷰 미지원</Text>
      <Text style={styles.placeholderHint}>
        {selectedFence ? `${selectedFence.fenceName}은(는)` : '이 반려동물의 울타리는'} Android 에뮬레이터/실기기
        빌드에서 확인하세요
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: DodoColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  placeholderHint: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
    paddingHorizontal: 32,
    textAlign: 'center',
  },
});
