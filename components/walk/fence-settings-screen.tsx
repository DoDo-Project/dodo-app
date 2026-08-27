import { ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DodoColors } from '@/constants/theme';

// TODO(이슈4/§6): GET /pets/list, GET /fence/boundaries 연동 후 mock 제거
export type PetFence = {
  petId: string;
  petName: string;
  radiusMeters: number;
  active: boolean;
  latitude: number;
  longitude: number;
};

export const MOCK_FENCES: PetFence[] = [
  { petId: 'sundubu', petName: '순두부', radiusMeters: 200, active: true, latitude: 37.5665, longitude: 126.978 },
  { petId: 'godeungeo', petName: '고등어', radiusMeters: 400, active: true, latitude: 37.5796, longitude: 126.977 },
  { petId: 'maltese', petName: '말티즈', radiusMeters: 250, active: true, latitude: 37.5636, longitude: 126.9834 },
  { petId: 'pold', petName: '폴드', radiusMeters: 180, active: false, latitude: 37.5711, longitude: 126.988 },
  { petId: 'puchi', petName: '푸치', radiusMeters: 300, active: true, latitude: 37.5704, longitude: 127.001 },
];

type RenderMapParams = {
  selectedFence: PetFence;
  fences: PetFence[];
};

type Props = {
  /**
   * 네이버 지도는 네이티브 전용 모듈이라 walk.tsx(native)/walk.web.tsx(web)로
   * 화면을 분리하고, 그 차이만 이 render prop으로 주입한다.
   */
  renderMap: (params: RenderMapParams) => ReactNode;
};

export function FenceSettingsScreen({ renderMap }: Props) {
  const [selectedPetId, setSelectedPetId] = useState(MOCK_FENCES[1].petId);
  const selectedFence = MOCK_FENCES.find((f) => f.petId === selectedPetId) ?? MOCK_FENCES[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>산책</Text>
      <Text style={styles.subtitle}>반려동물 안전 울타리를 설정하세요.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>울타리 설정</Text>

        <Text style={styles.label}>반려동물 선택</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {MOCK_FENCES.map((fence) => {
            const selected = fence.petId === selectedPetId;
            return (
              <TouchableOpacity
                key={fence.petId}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setSelectedPetId(fence.petId)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{fence.petName}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {renderMap({ selectedFence, fences: MOCK_FENCES })}

        <View style={styles.fenceInfoRow}>
          <View style={styles.fenceInfoTextCol}>
            <View style={styles.fenceInfoNameRow}>
              <Text style={styles.fenceInfoName}>{selectedFence.petName}</Text>
              <View
                style={[styles.statusBadge, selectedFence.active ? styles.statusBadgeActive : styles.statusBadgeIdle]}
              >
                <Text style={[styles.statusBadgeText, selectedFence.active && styles.statusBadgeTextActive]}>
                  {selectedFence.active ? '사용 중' : '미사용'}
                </Text>
              </View>
            </View>
            <Text style={styles.fenceInfoRadius}>반경 {selectedFence.radiusMeters}m</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>울타리 수정</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DodoColors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: DodoColors.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  card: {
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DodoColors.textPrimary,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.textSecondary,
    marginBottom: 8,
  },
  chipRow: {
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.background,
    marginRight: 8,
  },
  chipSelected: {
    borderColor: DodoColors.brand,
    backgroundColor: DodoColors.brand,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  chipTextSelected: {
    color: DodoColors.brandForeground,
  },
  map: {
    height: 260,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  fenceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fenceInfoTextCol: {
    gap: 4,
  },
  fenceInfoNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fenceInfoName: {
    fontSize: 16,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusBadgeActive: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeIdle: {
    backgroundColor: DodoColors.background,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: DodoColors.fenceIdleLabel,
  },
  statusBadgeTextActive: {
    color: DodoColors.fenceActiveLabel,
  },
  fenceInfoRadius: {
    fontSize: 13,
    color: DodoColors.textSecondary,
  },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DodoColors.border,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
});
