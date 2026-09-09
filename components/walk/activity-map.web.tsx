import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { DodoColors } from '@/constants/theme';

type Coord = { latitude: number; longitude: number };

type Props = {
  center: Coord;
  points: Coord[];
  currentLocation?: Coord | null;
  startPoint?: Coord | null;
};

// 네이버 지도 SDK는 네이티브 전용이라 웹 프리뷰에서는 안내 플레이스홀더만 보여준다.
export function ActivityMap(_props: Props) {
  return (
    <View style={styles.placeholder}>
      <Ionicons name="map-outline" size={36} color={DodoColors.fenceIdleLabel} />
      <Text style={styles.placeholderText}>네이버 지도는 웹 프리뷰 미지원</Text>
      <Text style={styles.placeholderHint}>실시간 산책 경로는 Android 에뮬레이터/실기기 빌드에서 확인하세요</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    height: 280,
    borderRadius: 12,
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
