import Ionicons from '@expo/vector-icons/Ionicons';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DodoColors } from '@/constants/theme';
import { deleteActivityHistory, getActivityHistory, type ActivityHistoryListItem } from '@/shared/api/activityApi';
import { formatFullDateTime } from '@/shared/lib/format/date';

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<string, string> = {
  BEFORE: '대기',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CANCELED: '중단됨',
};

export default function ActivityHistoryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const historyQuery = useInfiniteQuery({
    queryKey: ['activities', 'history'],
    queryFn: ({ pageParam }) => getActivityHistory(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.histories.length >= PAGE_SIZE ? allPages.length : undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: (historyId: number) => deleteActivityHistory(historyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities', 'history'] }),
    onError: () => Alert.alert('오류', '활동 기록을 삭제하지 못했어요.'),
  });

  const handleDelete = (historyId: number) => {
    Alert.alert('활동 기록 삭제', '이 활동 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteMutation.mutate(historyId) },
    ]);
  };

  const items = historyQuery.data?.pages.flatMap((p) => p.histories) ?? [];

  const renderItem = ({ item }: { item: ActivityHistoryListItem }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() =>
        router.push({ pathname: '/(tabs)/walk/history/[historyId]', params: { historyId: String(item.historyId) } })
      }
    >
      <View style={styles.avatar}>
        <Ionicons name="walk" size={22} color={DodoColors.brandForeground} />
      </View>
      <View style={styles.textCol}>
        <View style={styles.titleRow}>
          <Text style={styles.petName}>{item.pet.name}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {STATUS_LABEL[item.activityHistoryStatus] ?? item.activityHistoryStatus}
            </Text>
          </View>
        </View>
        <Text style={styles.meta}>{formatFullDateTime(item.activityHistoryStartAt)}</Text>
        <Text style={styles.meta}>
          {item.distance}km · 좋아요 {item.reactionCount}
          {item.heartAverage != null ? ` · 평균 심박 ${item.heartAverage}` : ''}
        </Text>
      </View>
      <TouchableOpacity hitSlop={8} onPress={() => handleDelete(item.historyId)}>
        <Ionicons name="trash-outline" size={18} color={DodoColors.fenceOutside} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => String(item.historyId)}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (historyQuery.hasNextPage && !historyQuery.isFetchingNextPage) historyQuery.fetchNextPage();
      }}
      ListEmptyComponent={
        historyQuery.isLoading ? (
          <ActivityIndicator color={DodoColors.brand} style={styles.loading} />
        ) : (
          <Text style={styles.emptyText}>아직 산책 기록이 없어요.</Text>
        )
      }
      ListFooterComponent={
        historyQuery.isFetchingNextPage ? <ActivityIndicator color={DodoColors.brand} style={styles.loading} /> : null
      }
    />
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
    flexGrow: 1,
  },
  loading: {
    marginTop: 40,
  },
  emptyText: {
    marginTop: 60,
    textAlign: 'center',
    fontSize: 13,
    color: DodoColors.fenceIdleLabel,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    padding: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: DodoColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  petName: {
    fontSize: 14,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: DodoColors.background,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  meta: {
    fontSize: 12,
    color: DodoColors.textSecondary,
  },
  separator: {
    height: 10,
  },
});
