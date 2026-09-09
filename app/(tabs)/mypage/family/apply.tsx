import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useState } from 'react';
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

import { DodoColors } from '@/constants/theme';
import { getFamilyApplications, joinFamily, type FamilyApplicationStatus } from '@/shared/api/familyApi';

type FilterLabel = '전체' | '승인 대기' | '거절됨';
const FILTERS: FilterLabel[] = ['전체', '승인 대기', '거절됨'];
const FILTER_STATUS: Record<FilterLabel, FamilyApplicationStatus | undefined> = {
  전체: undefined,
  '승인 대기': 'PENDING',
  거절됨: 'REJECTED',
};

function statusLabel(status: FamilyApplicationStatus): string {
  if (status === 'PENDING') return '승인 대기';
  if (status === 'APPROVED') return '승인됨';
  if (status === 'REJECTED') return '거절됨';
  return '차단됨';
}

function statusStyle(status: FamilyApplicationStatus) {
  if (status === 'REJECTED' || status === 'BLOCKED') return { bg: '#fee2e2', color: DodoColors.fenceOutside };
  if (status === 'APPROVED') return { bg: '#dcfce7', color: DodoColors.fenceActiveLabel };
  return { bg: DodoColors.background, color: DodoColors.fenceIdleLabel };
}

export default function FamilyApplyScreen() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [filter, setFilter] = useState<FilterLabel>('전체');

  const applicationsQuery = useQuery({
    queryKey: ['family', 'applications', filter],
    queryFn: () => getFamilyApplications(FILTER_STATUS[filter], 0, 20),
  });

  const applyMutation = useMutation({
    mutationFn: () => joinFamily(code.trim()),
    onSuccess: () => {
      setCode('');
      queryClient.invalidateQueries({ queryKey: ['family', 'applications'] });
      Alert.alert('가족 신청', '가족 신청을 보냈어요.');
    },
    onError: () => Alert.alert('오류', '가족 신청에 실패했어요. 코드를 다시 확인해주세요.'),
  });

  const applications = applicationsQuery.data?.applications ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>FAMILY</Text>
          <Text style={styles.title}>가족 신청 관리</Text>
        </View>
        <Link href="/(tabs)/mypage/family" asChild>
          <TouchableOpacity style={styles.outlineButton}>
            <Text style={styles.outlineButtonText}>메인 보기</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.card}>
        <Text style={styles.infoLabel}>가족 신청</Text>
        <Text style={styles.hintText}>
          가족 코드를 입력하면 신청할 수 있어요. 신청 상태는 내 신청 내역에서 확인해요.
        </Text>
        <View style={styles.applyRow}>
          <TextInput
            style={styles.input}
            placeholder="가족 코드 입력"
            placeholderTextColor={DodoColors.fenceIdleLabel}
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            autoCapitalize="characters"
            maxLength={6}
          />
          <TouchableOpacity
            style={styles.primaryButton}
            disabled={!code.trim() || applyMutation.isPending}
            onPress={() => applyMutation.mutate()}
          >
            <Text style={styles.primaryButtonText}>{applyMutation.isPending ? '신청 중...' : '가족 신청'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.infoLabel}>내 신청 내역</Text>
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

        {applicationsQuery.isLoading ? (
          <ActivityIndicator color={DodoColors.brand} />
        ) : applications.length === 0 ? (
          <Text style={styles.emptyText}>표시할 신청 내역이 없어요.</Text>
        ) : (
          applications.map((request) => {
            const style = statusStyle(request.status);
            return (
              <View key={request.applicationId} style={styles.requestRow}>
                <View style={styles.requestAvatar}>
                  <Ionicons name="paw" size={16} color={DodoColors.brandForeground} />
                </View>
                <View style={styles.requestTextCol}>
                  <View style={styles.requestNameRow}>
                    <Text style={styles.requestPetName}>{request.petName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: style.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: style.color }]}>
                        {statusLabel(request.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.requestDate}>{request.appliedAt}</Text>
                </View>
              </View>
            );
          })
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
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: DodoColors.fenceIdleLabel,
    letterSpacing: 0.3,
  },
  hintText: {
    fontSize: 11,
    lineHeight: 16,
    color: DodoColors.fenceIdleLabel,
  },
  applyRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.background,
    paddingHorizontal: 12,
    fontSize: 12,
    color: DodoColors.textPrimary,
  },
  primaryButton: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 10,
    backgroundColor: DodoColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: DodoColors.brandForeground,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
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
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: DodoColors.background,
  },
  requestAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: DodoColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestTextCol: {
    flex: 1,
    gap: 2,
  },
  requestNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestPetName: {
    fontSize: 13,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  requestDate: {
    fontSize: 10,
    color: DodoColors.fenceIdleLabel,
  },
});
