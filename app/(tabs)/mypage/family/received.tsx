import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DodoColors } from '@/constants/theme';
import {
  approveFamilyApplication,
  getBlockedUsers,
  getPendingUsers,
  unblockFamilyUser,
  type FamilyApprovalAction,
} from '@/shared/api/familyApi';

type FilterLabel = '승인 대기' | '거절됨';
const FILTERS: FilterLabel[] = ['승인 대기', '거절됨'];

export default function FamilyReceivedScreen() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterLabel>('승인 대기');

  const pendingQuery = useQuery({
    queryKey: ['family', 'pending-users', filter],
    queryFn: () => getPendingUsers(filter === '승인 대기' ? 'PENDING' : 'REJECTED', 0, 20),
  });

  const blockedQuery = useQuery({
    queryKey: ['family', 'blocked-users'],
    queryFn: () => getBlockedUsers(0, 20),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['family', 'pending-users'] });
    queryClient.invalidateQueries({ queryKey: ['family', 'blocked-users'] });
  };

  const approvalMutation = useMutation({
    mutationFn: ({
      petId,
      targetUserId,
      action,
    }: {
      petId: number;
      targetUserId: string;
      action: FamilyApprovalAction;
    }) => approveFamilyApplication(petId, targetUserId, action),
    onSuccess: invalidateAll,
    onError: () => Alert.alert('오류', '요청을 처리하지 못했어요.'),
  });

  const unblockMutation = useMutation({
    mutationFn: ({ petId, targetUserId }: { petId: number; targetUserId: string }) =>
      unblockFamilyUser(petId, targetUserId),
    onSuccess: invalidateAll,
    onError: () => Alert.alert('오류', '차단을 해제하지 못했어요.'),
  });

  const requests = pendingQuery.data?.users ?? [];
  const blocked = blockedQuery.data?.users ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>FAMILY</Text>
          <Text style={styles.title}>받은 신청 목록</Text>
        </View>
        <Link href="/(tabs)/mypage/family" asChild>
          <TouchableOpacity style={styles.outlineButton}>
            <Text style={styles.outlineButtonText}>메인 보기</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.infoLabel}>받은 신청 목록</Text>
          <View style={styles.filterRow}>
            {FILTERS.map((f) => {
              const selected = f === filter;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, selected && styles.filterChipSelected]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{f}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {pendingQuery.isLoading ? (
          <ActivityIndicator color={DodoColors.brand} />
        ) : requests.length === 0 ? (
          <Text style={styles.emptyText}>아직 받은 신청이 없어요.</Text>
        ) : (
          requests.map((request) => (
            <View key={`${request.petId}-${request.userId}`} style={styles.requestRow}>
              <View style={styles.requestTextCol}>
                <Text style={styles.requestPetName}>
                  {request.userName} → {request.petName}
                </Text>
                <Text style={styles.requestDate}>{request.appliedAt}</Text>
              </View>
              {filter === '승인 대기' && (
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      approvalMutation.mutate({
                        petId: request.petId,
                        targetUserId: request.userId,
                        action: 'APPROVED',
                      })
                    }
                  >
                    <Text style={styles.actionButtonText}>승인</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      approvalMutation.mutate({
                        petId: request.petId,
                        targetUserId: request.userId,
                        action: 'REJECTED',
                      })
                    }
                  >
                    <Text style={styles.actionButtonText}>거절</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonDanger]}
                    onPress={() =>
                      approvalMutation.mutate({ petId: request.petId, targetUserId: request.userId, action: 'BLOCKED' })
                    }
                  >
                    <Text style={styles.actionButtonDangerText}>차단</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.infoLabel}>차단 목록</Text>
        {blockedQuery.isLoading ? (
          <ActivityIndicator color={DodoColors.brand} />
        ) : blocked.length === 0 ? (
          <Text style={styles.emptyText}>차단 목록이 비어 있어요.</Text>
        ) : (
          blocked.map((entry) => (
            <View key={`${entry.petId}-${entry.userId}`} style={styles.requestRow}>
              <Text style={styles.requestPetName}>
                {entry.userName} → {entry.petName}
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => unblockMutation.mutate({ petId: entry.petId, targetUserId: entry.userId })}
              >
                <Text style={styles.actionButtonText}>차단 해제</Text>
              </TouchableOpacity>
            </View>
          ))
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
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: DodoColors.brand,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  outlineButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DodoColors.border,
  },
  outlineButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  card: {
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    padding: 16,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: DodoColors.fenceIdleLabel,
    letterSpacing: 0.3,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: DodoColors.background,
  },
  filterChipSelected: {
    backgroundColor: DodoColors.textPrimary,
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  filterChipTextSelected: {
    color: DodoColors.brandForeground,
  },
  emptyText: {
    fontSize: 12,
    color: DodoColors.fenceIdleLabel,
  },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: DodoColors.background,
    gap: 8,
  },
  requestTextCol: {
    flex: 1,
    gap: 2,
  },
  requestPetName: {
    fontSize: 13,
    fontWeight: '600',
    color: DodoColors.textPrimary,
  },
  requestDate: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DodoColors.border,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  actionButtonDanger: {
    borderColor: DodoColors.fenceOutside,
  },
  actionButtonDangerText: {
    fontSize: 11,
    fontWeight: '600',
    color: DodoColors.fenceOutside,
  },
});
