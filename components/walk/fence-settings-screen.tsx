import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DodoColors } from '@/constants/theme';
import { createFence, getFenceBoundaries, toggleFence, updateFence } from '@/shared/api/fenceApi';
import { getPetsList } from '@/shared/api/petApi';
import { useFenceLocationSocket, type FenceLocationPayload } from '@/shared/lib/ws/useFenceLocationSocket';

import { WalkTabSwitcher, type WalkTab } from './walk-tab-switcher';

// 웹(dodo-frontend)과 동일하게 울타리는 원(중심+반경)만 지원하고 pet당 1개만 존재한다.
export type Fence = {
  fenceId: number;
  petId: number;
  fenceName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  active: boolean;
};

type Coord = { latitude: number; longitude: number };

// 아직 실시간 위치/펫 위치를 모를 때 지도 초기 중심 — 서울시청 좌표
export const DEFAULT_CENTER: Coord = { latitude: 37.5665, longitude: 126.978 };

type RenderMapParams = {
  center: Coord;
  fences: Fence[];
  selectedPetId: number | null;
  liveLocation: FenceLocationPayload | null;
  pendingCenter: Coord | null;
  pendingRadius: number | null;
  onTapMap: (coord: Coord) => void;
};

type Props = {
  /**
   * 네이버 지도는 네이티브 전용 모듈이라 walk.tsx(native)/walk.web.tsx(web)로
   * 화면을 분리하고, 그 차이만 이 render prop으로 주입한다.
   */
  renderMap: (params: RenderMapParams) => ReactNode;
  activeTab: WalkTab;
  onChangeTab: (tab: WalkTab) => void;
};

export function FenceSettingsScreen({ renderMap, activeTab, onChangeTab }: Props) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const petsQuery = useQuery({ queryKey: ['pets', 'list'], queryFn: () => getPetsList(0, 10) });
  const fencesQuery = useQuery({ queryKey: ['fence', 'boundaries'], queryFn: getFenceBoundaries });

  const pets = useMemo(() => petsQuery.data?.pets ?? [], [petsQuery.data]);
  // 네이티브 지도(NaverMap)는 좌표가 NaN이면 앱이 통째로 죽으므로(JS 에러가 아니라 네이티브 크래시),
  // 백엔드 필드가 예상과 달라 undefined가 섞여도 절대 지도로 넘어가지 않도록 여기서 걸러낸다.
  const fences: Fence[] = (fencesQuery.data?.boundaries ?? [])
    .map((b) => ({
      fenceId: b.fenceId,
      petId: b.petId,
      fenceName: b.fenceName,
      latitude: b.center?.latitude,
      longitude: b.center?.longitude,
      radiusMeters: b.radius,
      active: b.isActive,
    }))
    .filter(
      (f): f is Fence => Number.isFinite(f.latitude) && Number.isFinite(f.longitude) && Number.isFinite(f.radiusMeters),
    );

  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  useEffect(() => {
    if (selectedPetId === null && pets.length > 0) setSelectedPetId(pets[0].petId);
  }, [pets, selectedPetId]);

  const selectedFence = fences.find((f) => f.petId === selectedPetId) ?? null;
  const selectedPet = pets.find((p) => p.petId === selectedPetId) ?? null;
  const liveLocation = useFenceLocationSocket(selectedPetId);

  const [isEditing, setIsEditing] = useState(false);
  const [fenceNameInput, setFenceNameInput] = useState('');
  const [radiusInput, setRadiusInput] = useState(200);
  const [pendingCenter, setPendingCenter] = useState<Coord | null>(null);

  const startEditing = () => {
    setFenceNameInput(selectedFence?.fenceName ?? (selectedPet ? `${selectedPet.name}의 울타리` : ''));
    setRadiusInput(selectedFence?.radiusMeters ?? 200);
    setPendingCenter(
      selectedFence
        ? { latitude: selectedFence.latitude, longitude: selectedFence.longitude }
        : liveLocation
          ? { latitude: liveLocation.latitude, longitude: liveLocation.longitude }
          : DEFAULT_CENTER,
    );
    setIsEditing(true);
  };

  const toggleMutation = useMutation({
    mutationFn: ({ fenceId, active }: { fenceId: number; active: boolean }) => toggleFence(fenceId, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fence', 'boundaries'] }),
    onError: () => Alert.alert('오류', '울타리 상태를 변경하지 못했어요.'),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!pendingCenter || !selectedPetId) return;
      if (selectedFence) {
        await updateFence(selectedFence.fenceId, {
          centerLatitude: pendingCenter.latitude,
          centerLongitude: pendingCenter.longitude,
          fenceName: fenceNameInput.trim(),
          radius: radiusInput,
        });
      } else {
        await createFence({
          petId: selectedPetId,
          centerLatitude: pendingCenter.latitude,
          centerLongitude: pendingCenter.longitude,
          radius: radiusInput,
          fenceName: fenceNameInput.trim(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fence', 'boundaries'] });
      setIsEditing(false);
    },
    onError: () => Alert.alert('오류', '울타리를 저장하지 못했어요. 잠시 후 다시 시도해주세요.'),
  });

  const rawMapCenter: Coord =
    pendingCenter ??
    (selectedFence
      ? { latitude: selectedFence.latitude, longitude: selectedFence.longitude }
      : liveLocation
        ? { latitude: liveLocation.latitude, longitude: liveLocation.longitude }
        : DEFAULT_CENTER);
  // 네이티브 지도 크래시(NaN 좌표) 방지용 최종 안전망
  const mapCenter: Coord =
    Number.isFinite(rawMapCenter.latitude) && Number.isFinite(rawMapCenter.longitude) ? rawMapCenter : DEFAULT_CENTER;

  // 웹과 동일하게 서버의 insideFence 값을 그대로 쓰지 않고 fenceActive와 조합해 클라이언트에서 재계산
  const showOutsideBanner = !!selectedFence?.active && !!liveLocation && !liveLocation.insideFence;

  if (petsQuery.isLoading || fencesQuery.isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top + 16 }]}>
        <WalkTabSwitcher value={activeTab} onChange={onChangeTab} />
        <ActivityIndicator color={DodoColors.brand} />
      </View>
    );
  }

  if (pets.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16, padding: 16 }]}>
        <WalkTabSwitcher value={activeTab} onChange={onChangeTab} />
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>산책 울타리를 설정하려면 먼저 반려동물을 등록해주세요.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>산책</Text>
        <Text style={styles.subtitle}>반려동물 안전 울타리를 설정하세요.</Text>
        <WalkTabSwitcher value={activeTab} onChange={onChangeTab} />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>울타리 설정</Text>

          <Text style={styles.label}>반려동물 선택</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {pets.map((pet) => {
              const selected = pet.petId === selectedPetId;
              return (
                <TouchableOpacity
                  key={pet.petId}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => {
                    setSelectedPetId(pet.petId);
                    setIsEditing(false);
                  }}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{pet.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {renderMap({
            center: mapCenter,
            fences,
            selectedPetId,
            liveLocation,
            pendingCenter: isEditing ? pendingCenter : null,
            pendingRadius: isEditing ? radiusInput : null,
            onTapMap: (coord) => {
              if (isEditing) setPendingCenter(coord);
            },
          })}

          {showOutsideBanner && (
            <View style={styles.outsideBanner}>
              <Text style={styles.outsideBannerText}>
                {selectedPet?.name}이(가) 울타리를 벗어났어요! (약 {Math.round(liveLocation?.distanceMeter ?? 0)}m)
              </Text>
            </View>
          )}

          {!isEditing ? (
            selectedFence ? (
              <View style={styles.fenceInfoRow}>
                <View style={styles.fenceInfoTextCol}>
                  <View style={styles.fenceInfoNameRow}>
                    <Text style={styles.fenceInfoName}>{selectedFence.fenceName}</Text>
                    <TouchableOpacity
                      disabled={toggleMutation.isPending}
                      onPress={() =>
                        toggleMutation.mutate({ fenceId: selectedFence.fenceId, active: !selectedFence.active })
                      }
                      style={[
                        styles.statusBadge,
                        selectedFence.active ? styles.statusBadgeActive : styles.statusBadgeIdle,
                      ]}
                    >
                      <Text style={[styles.statusBadgeText, selectedFence.active && styles.statusBadgeTextActive]}>
                        {selectedFence.active ? '사용 중' : '미사용'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.fenceInfoRadius}>반경 {selectedFence.radiusMeters}m</Text>
                </View>
                <TouchableOpacity style={styles.editButton} onPress={startEditing}>
                  <Text style={styles.editButtonText}>울타리 수정</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.fenceInfoRow}>
                <Text style={styles.emptyFenceText}>{selectedPet?.name}에게 설정된 울타리가 없어요.</Text>
                <TouchableOpacity style={styles.editButton} onPress={startEditing}>
                  <Text style={styles.editButtonText}>울타리 생성</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            <View style={styles.editForm}>
              <Text style={styles.label}>울타리 이름</Text>
              <TextInput
                style={styles.input}
                value={fenceNameInput}
                onChangeText={setFenceNameInput}
                placeholder="예: 우리집 앞마당"
                placeholderTextColor={DodoColors.fenceIdleLabel}
              />

              <Text style={styles.label}>반경 {radiusInput}m · 지도를 눌러 중심을 옮길 수 있어요</Text>
              <View style={styles.radiusStepperRow}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setRadiusInput((r) => Math.max(50, r - 50))}
                >
                  <Text style={styles.stepperButtonText}>-50m</Text>
                </TouchableOpacity>
                <Text style={styles.radiusValue}>{radiusInput}m</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setRadiusInput((r) => Math.min(2000, r + 50))}
                >
                  <Text style={styles.stepperButtonText}>+50m</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.editActionsRow}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setIsEditing(false)}>
                  <Text style={styles.secondaryButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, saveMutation.isPending && styles.primaryButtonDisabled]}
                  disabled={saveMutation.isPending || !fenceNameInput.trim() || !pendingCenter}
                  onPress={() => saveMutation.mutate()}
                >
                  <Text style={styles.primaryButtonText}>{saveMutation.isPending ? '저장 중...' : '저장'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DodoColors.background,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 13,
    color: DodoColors.fenceIdleLabel,
    textAlign: 'center',
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
  outsideBanner: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  outsideBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: DodoColors.fenceOutside,
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
  emptyFenceText: {
    fontSize: 12,
    color: DodoColors.fenceIdleLabel,
    flex: 1,
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
  editForm: {
    gap: 8,
  },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.background,
    paddingHorizontal: 12,
    fontSize: 13,
    color: DodoColors.textPrimary,
    marginBottom: 4,
  },
  radiusStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  stepperButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DodoColors.border,
  },
  stepperButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  radiusValue: {
    fontSize: 14,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  editActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DodoColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  primaryButton: {
    flex: 1.4,
    height: 44,
    borderRadius: 10,
    backgroundColor: DodoColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: DodoColors.brandForeground,
  },
});
