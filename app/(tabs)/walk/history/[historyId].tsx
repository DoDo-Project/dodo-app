import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ActivityMap } from '@/components/walk/activity-map';
import { DodoColors } from '@/constants/theme';
import { deleteActivityHistory, getActivityHistoryDetail, getActivityRoute } from '@/shared/api/activityApi';
import { durationSecondsBetween, formatDurationSeconds, formatFullDateTime } from '@/shared/lib/format/date';

const STATUS_LABEL: Record<string, string> = {
  BEFORE: '대기',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CANCELED: '중단됨',
};

export default function ActivityHistoryDetailScreen() {
  const { historyId } = useLocalSearchParams<{ historyId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const routeQuery = useQuery({
    queryKey: ['activities', 'route', historyId],
    queryFn: () => getActivityRoute(historyId),
    enabled: !!historyId,
  });

  const detailQuery = useQuery({
    queryKey: ['activities', 'detail', historyId],
    queryFn: () => getActivityHistoryDetail(historyId),
    enabled: !!historyId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteActivityHistory(historyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', 'history'] });
      router.back();
    },
    onError: () => Alert.alert('오류', '활동 기록을 삭제하지 못했어요.'),
  });

  const handleDelete = () => {
    Alert.alert('활동 기록 삭제', '이 활동 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  if (routeQuery.isError && isAxiosError(routeQuery.error) && routeQuery.error.response?.status === 403) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.emptyText}>이 활동 기록을 볼 권한이 없어요.</Text>
      </View>
    );
  }

  if (routeQuery.isLoading || !routeQuery.data) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator color={DodoColors.brand} />
      </View>
    );
  }

  const route = routeQuery.data;
  const points = route.routePoints.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));
  const center = points[0] ?? { latitude: route.startLatitude, longitude: route.startLongitude };
  const duration = route.activityHistoryEndAt
    ? durationSecondsBetween(route.activityHistoryStartAt, route.activityHistoryEndAt)
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>
            {STATUS_LABEL[route.activityHistoryStatus] ?? route.activityHistoryStatus}
          </Text>
        </View>
        <TouchableOpacity onPress={handleDelete} disabled={deleteMutation.isPending}>
          <Text style={styles.deleteText}>{deleteMutation.isPending ? '삭제 중...' : '삭제'}</Text>
        </TouchableOpacity>
      </View>

      <ActivityMap center={center} points={points} startPoint={points[0] ?? null} />

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>이동 거리</Text>
          <Text style={styles.statValue}>{route.distance}km</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>소요 시간</Text>
          <Text style={styles.statValue}>{duration != null ? formatDurationSeconds(duration) : '-'}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>좋아요</Text>
          <Text style={styles.statValue}>{detailQuery.data?.reactionCount ?? '-'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.infoRow}>시작 {formatFullDateTime(route.activityHistoryStartAt)}</Text>
        {route.activityHistoryEndAt && (
          <Text style={styles.infoRow}>종료 {formatFullDateTime(route.activityHistoryEndAt)}</Text>
        )}
      </View>
    </ScrollView>
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
  },
  emptyText: {
    fontSize: 13,
    color: DodoColors.fenceIdleLabel,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: DodoColors.surface,
    borderWidth: 1,
    borderColor: DodoColors.border,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.fenceOutside,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    padding: 16,
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
  card: {
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    padding: 16,
    gap: 6,
  },
  infoRow: {
    fontSize: 12,
    color: DodoColors.textSecondary,
  },
});
