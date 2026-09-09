import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DEFAULT_CENTER } from '@/components/walk/fence-settings-screen';
import { DodoColors } from '@/constants/theme';
import { getPopularActivities, type PopularReactionType } from '@/shared/api/activityApi';
import { getPetsList } from '@/shared/api/petApi';
import { formatFullDateTime } from '@/shared/lib/format/date';
import { useFenceLocationSocket } from '@/shared/lib/ws/useFenceLocationSocket';

export default function PopularActivitiesScreen() {
  const router = useRouter();
  const [reactionType, setReactionType] = useState<PopularReactionType>('LIKE');

  // 폰 GPS 대신 반려동물 트래커의 실시간 위치를 "내 주변" 기준 좌표로 재사용 (앱 전체에서 폰 GPS를 쓰지 않는 정책과 통일)
  const petsQuery = useQuery({ queryKey: ['pets', 'list'], queryFn: () => getPetsList(0, 1) });
  const firstPetId = petsQuery.data?.pets[0]?.petId ?? null;
  const liveLocation = useFenceLocationSocket(firstPetId);
  const origin = useMemo(
    () => (liveLocation ? { latitude: liveLocation.latitude, longitude: liveLocation.longitude } : DEFAULT_CENTER),
    [liveLocation],
  );

  const popularQuery = useQuery({
    queryKey: ['activities', 'popular', reactionType, origin.latitude, origin.longitude],
    queryFn: () =>
      getPopularActivities({ latitude: origin.latitude, longitude: origin.longitude, reactionType, limit: 20 }),
  });

  const items = popularQuery.data?.histories ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.hint}>내 반려동물 트래커 위치를 기준으로 가까운 인기 활동을 보여줘요.</Text>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, reactionType === 'LIKE' && styles.filterChipSelected]}
          onPress={() => setReactionType('LIKE')}
        >
          <Text style={[styles.filterChipText, reactionType === 'LIKE' && styles.filterChipTextSelected]}>
            좋아요순
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, reactionType === 'DISLIKE' && styles.filterChipSelected]}
          onPress={() => setReactionType('DISLIKE')}
        >
          <Text style={[styles.filterChipText, reactionType === 'DISLIKE' && styles.filterChipTextSelected]}>
            싫어요순
          </Text>
        </TouchableOpacity>
      </View>

      {popularQuery.isLoading ? (
        <ActivityIndicator color={DodoColors.brand} style={styles.loading} />
      ) : items.length === 0 ? (
        <Text style={styles.emptyText}>주변에 표시할 활동이 없어요.</Text>
      ) : (
        <View style={styles.list}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={item.historyId}
              style={[styles.row, index === items.length - 1 && styles.rowLast]}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/walk/history/[historyId]',
                  params: { historyId: String(item.historyId) },
                })
              }
            >
              <View style={styles.avatar}>
                <Ionicons name="walk" size={20} color={DodoColors.brandForeground} />
              </View>
              <View style={styles.textCol}>
                <Text style={styles.petName}>{item.pet.name}</Text>
                <Text style={styles.meta}>{formatFullDateTime(item.activityHistoryStartAt)}</Text>
                <Text style={styles.meta}>
                  {item.distance}km · 좋아요 {item.reactionCount}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DodoColors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  hint: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: DodoColors.surface,
    borderWidth: 1,
    borderColor: DodoColors.border,
  },
  filterChipSelected: {
    backgroundColor: DodoColors.textPrimary,
    borderColor: DodoColors.textPrimary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  filterChipTextSelected: {
    color: DodoColors.brandForeground,
  },
  loading: {
    marginTop: 40,
  },
  emptyText: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 13,
    color: DodoColors.fenceIdleLabel,
  },
  list: {
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: DodoColors.background,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: DodoColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  petName: {
    fontSize: 13,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  meta: {
    fontSize: 11,
    color: DodoColors.textSecondary,
  },
});
