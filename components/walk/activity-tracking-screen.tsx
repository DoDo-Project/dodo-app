import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DodoColors } from '@/constants/theme';
import {
  cancelActivityHistory,
  createActivityHistory,
  finishActivityHistory,
  getActivityHistoryDetail,
  getPetActivityStatus,
  inferActivityStatus,
  startActivityHistory,
} from '@/shared/api/activityApi';
import { getPetListName, getPetsList } from '@/shared/api/petApi';
import { durationSecondsBetween, formatDurationSeconds } from '@/shared/lib/format/date';
import { totalRouteDistanceMeters } from '@/shared/lib/geo/haversine';
import { useCurrentLocation } from '@/shared/lib/geo/useCurrentLocation';
import { useActivityLocationSocket } from '@/shared/lib/ws/useActivityLocationSocket';
import { useFenceLocationSocket } from '@/shared/lib/ws/useFenceLocationSocket';

import { ActivityMap } from './activity-map';
import { DEFAULT_CENTER } from './fence-settings-screen';
import { WalkTabSwitcher, type WalkTab } from './walk-tab-switcher';

type Coord = { latitude: number; longitude: number };
type TrackingState = 'idle' | 'in_progress' | 'paused';

type Props = {
  activeTab: WalkTab;
  onChangeTab: (tab: WalkTab) => void;
};

export function ActivityTrackingScreen({ activeTab, onChangeTab }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const petsQuery = useQuery({ queryKey: ['pets', 'list'], queryFn: () => getPetsList(0, 10) });
  const pets = useMemo(() => petsQuery.data?.pets ?? [], [petsQuery.data]);

  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  useEffect(() => {
    if (selectedPetId === null && pets.length > 0) setSelectedPetId(pets[0].petId);
  }, [pets, selectedPetId]);

  const [trackingState, setTrackingState] = useState<TrackingState>('idle');
  const [liveHistoryId, setLiveHistoryId] = useState<number | null>(null);
  const [routePoints, setRoutePoints] = useState<Coord[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // 펫 트래커 위치(시작 좌표 확보용) — 울타리 기능과 같은 채널, petId 기준
  const liveLocation = useFenceLocationSocket(selectedPetId);
  // 폰의 실제 GPS 위치 — 펫 트래커 위치가 아직 없을 때 지도/시작 좌표의 대체값으로 쓴다
  const currentUserLocation = useCurrentLocation();
  // 산책 활동 실시간 경로 — historyId 기준 별도 채널(백엔드 확인됨). 진행 중일 때만 구독한다.
  const activityRoutePoint = useActivityLocationSocket(trackingState === 'in_progress' ? liveHistoryId : null);
  const activityCoord: Coord | null = activityRoutePoint
    ? { latitude: activityRoutePoint.latitude, longitude: activityRoutePoint.longitude }
    : null;

  // 펫을 바꾸면 새로 시작하는 상태로 초기화 — 진행 중인 산책은 status 조회가 다시 복원해준다
  useEffect(() => {
    setTrackingState('idle');
    setLiveHistoryId(null);
    setRoutePoints([]);
    setElapsedSeconds(0);
  }, [selectedPetId]);

  const statusQuery = useQuery({
    queryKey: ['activities', 'status', selectedPetId],
    queryFn: () => getPetActivityStatus(selectedPetId as number),
    enabled: selectedPetId !== null && trackingState === 'idle',
  });

  // 앱을 재시작해도 이미 진행 중/일시정지 중인 산책이 있으면 이어서 보여준다 (경과 시간은 서버 시작 시각 기준으로 복원)
  useEffect(() => {
    if (!statusQuery.data || trackingState !== 'idle') return;
    const inferred = inferActivityStatus(statusQuery.data.message);
    const historyId = statusQuery.data.historyId;
    if (!historyId) return;

    if (inferred === 'BEFORE') {
      setLiveHistoryId(historyId);
      return;
    }
    if (inferred !== 'IN_PROGRESS' && inferred !== 'CANCELED') return;

    setLiveHistoryId(historyId);
    setTrackingState(inferred === 'IN_PROGRESS' ? 'in_progress' : 'paused');

    getActivityHistoryDetail(historyId)
      .then((detail) => {
        const endReference =
          inferred === 'IN_PROGRESS'
            ? new Date().toISOString()
            : (detail.activityHistoryEndAt ?? new Date().toISOString());
        setElapsedSeconds(durationSecondsBetween(detail.activityHistoryStartAt, endReference));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusQuery.data]);

  // 진행 중일 때만 매초 경과 시간 증가
  useEffect(() => {
    if (trackingState !== 'in_progress') return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [trackingState]);

  // 진행 중일 때만 활동 전용 WS(historyId 채널)로 들어오는 경로 포인트를 누적
  useEffect(() => {
    if (trackingState !== 'in_progress' || !activityCoord) return;
    setRoutePoints((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.latitude === activityCoord.latitude && last.longitude === activityCoord.longitude) return prev;
      return [...prev, activityCoord];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityRoutePoint, trackingState]);

  const liveDistanceKm = useMemo(() => totalRouteDistanceMeters(routePoints) / 1000, [routePoints]);

  const startMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPetId) throw new Error('no pet selected');
      let historyId = liveHistoryId;
      if (!historyId) {
        const created = await createActivityHistory({ petId: selectedPetId, activityType: 'WALKING' });
        historyId = created.historyId;
      }
      const coord: Coord = liveLocation
        ? { latitude: liveLocation.latitude, longitude: liveLocation.longitude }
        : (currentUserLocation ?? DEFAULT_CENTER);
      await startActivityHistory(historyId, { startLatitude: coord.latitude, startLongitude: coord.longitude });
      return { historyId, coord };
    },
    onSuccess: ({ historyId, coord }) => {
      setLiveHistoryId(historyId);
      setTrackingState('in_progress');
      setRoutePoints((prev) => (prev.length === 0 ? [coord] : prev));
      queryClient.invalidateQueries({ queryKey: ['activities', 'status', selectedPetId] });
    },
    onError: (error: unknown) => {
      if (isAxiosError(error) && error.response?.status === 409) {
        Alert.alert('알림', '이미 진행 중인 산책이 있어요.');
        statusQuery.refetch();
        return;
      }
      Alert.alert('오류', '산책을 시작하지 못했어요. 잠시 후 다시 시도해주세요.');
    },
  });

  const pauseMutation = useMutation({
    mutationFn: () => cancelActivityHistory(liveHistoryId as number),
    onSuccess: () => setTrackingState('paused'),
    onError: () => Alert.alert('오류', '산책을 일시정지하지 못했어요.'),
  });

  const finishMutation = useMutation({
    mutationFn: () => finishActivityHistory(liveHistoryId as number),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['activities', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['activities', 'status', selectedPetId] });
      const duration = formatDurationSeconds(
        durationSecondsBetween(result.activityHistoryStartAt, result.activityHistoryEndAt),
      );
      Alert.alert('산책 완료', `이동 거리 ${result.distance}km, 소요 시간 ${duration}`);
      setTrackingState('idle');
      setLiveHistoryId(null);
      setRoutePoints([]);
      setElapsedSeconds(0);
    },
    onError: () => Alert.alert('오류', '산책을 종료하지 못했어요.'),
  });

  const handleFinish = () => {
    Alert.alert('산책 종료', '산책을 종료할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '종료', onPress: () => finishMutation.mutate() },
    ]);
  };

  const handleQuit = () => {
    setTrackingState('idle');
    setLiveHistoryId(null);
    setRoutePoints([]);
    setElapsedSeconds(0);
  };

  const selectedPet = pets.find((p) => p.petId === selectedPetId) ?? null;
  const isTracking = trackingState !== 'idle';
  const mapCenter =
    activityCoord ?? routePoints[routePoints.length - 1] ?? liveLocation ?? currentUserLocation ?? DEFAULT_CENTER;

  if (petsQuery.isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top + 16 }]}>
        <WalkTabSwitcher value={activeTab} onChange={onChangeTab} />
        <ActivityIndicator color={DodoColors.brand} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>산책</Text>
        <Text style={styles.subtitle}>반려동물과의 산책을 실시간으로 기록해보세요.</Text>
        <WalkTabSwitcher value={activeTab} onChange={onChangeTab} />

        {pets.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>산책을 기록하려면 먼저 반려동물을 등록해주세요.</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>반려동물 선택</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {pets.map((pet) => {
                  const selected = pet.petId === selectedPetId;
                  return (
                    <TouchableOpacity
                      key={pet.petId}
                      disabled={isTracking}
                      style={[styles.chip, selected && styles.chipSelected, isTracking && styles.chipDisabled]}
                      onPress={() => setSelectedPetId(pet.petId)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{getPetListName(pet)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <ActivityMap
                center={mapCenter}
                points={routePoints}
                currentLocation={isTracking ? activityCoord : currentUserLocation}
                startPoint={routePoints[0] ?? null}
              />

              {isTracking && (
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>경과 시간</Text>
                    <Text style={styles.statValue}>{formatDurationSeconds(elapsedSeconds)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>이동 거리</Text>
                    <Text style={styles.statValue}>{liveDistanceKm.toFixed(2)}km</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>상태</Text>
                    <Text style={styles.statValue}>{trackingState === 'in_progress' ? '진행 중' : '일시정지'}</Text>
                  </View>
                </View>
              )}

              {!isTracking ? (
                <TouchableOpacity
                  style={[styles.primaryButton, (!selectedPetId || startMutation.isPending) && styles.buttonDisabled]}
                  disabled={!selectedPetId || startMutation.isPending}
                  onPress={() => startMutation.mutate()}
                >
                  <Text style={styles.primaryButtonText}>
                    {startMutation.isPending
                      ? '시작하는 중...'
                      : `${selectedPet ? getPetListName(selectedPet) : ''} 산책 시작`}
                  </Text>
                </TouchableOpacity>
              ) : trackingState === 'in_progress' ? (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    disabled={pauseMutation.isPending}
                    onPress={() => pauseMutation.mutate()}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {pauseMutation.isPending ? '처리 중...' : '일시정지'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryButton, styles.flexButton, finishMutation.isPending && styles.buttonDisabled]}
                    disabled={finishMutation.isPending}
                    onPress={handleFinish}
                  >
                    <Text style={styles.primaryButtonText}>
                      {finishMutation.isPending ? '종료하는 중...' : '산책 종료'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={handleQuit}>
                    <Text style={styles.secondaryButtonText}>그만하기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryButton, styles.flexButton, startMutation.isPending && styles.buttonDisabled]}
                    disabled={startMutation.isPending}
                    onPress={() => startMutation.mutate()}
                  >
                    <Text style={styles.primaryButtonText}>
                      {startMutation.isPending ? '재개하는 중...' : '다시 시작'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.navCard} onPress={() => router.push('/(tabs)/walk/history')}>
                <Text style={styles.navCardTitle}>내 활동 기록</Text>
                <Text style={styles.navCardHint}>지난 산책 목록과 경로를 확인해요</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navCard} onPress={() => router.push('/(tabs)/walk/popular')}>
                <Text style={styles.navCardTitle}>주변 인기 활동</Text>
                <Text style={styles.navCardHint}>근처 반려동물의 산책을 둘러봐요</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DodoColors.background,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
    gap: 14,
  },
  emptyText: {
    fontSize: 13,
    color: DodoColors.fenceIdleLabel,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  chipRow: {
    marginTop: -6,
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
  chipDisabled: {
    opacity: 0.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  chipTextSelected: {
    color: DodoColors.brandForeground,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  primaryButton: {
    height: 46,
    borderRadius: 12,
    backgroundColor: DodoColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: DodoColors.brandForeground,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  flexButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
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
  navRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  navCard: {
    flex: 1,
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    padding: 14,
    gap: 4,
  },
  navCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  navCardHint: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
  },
});
