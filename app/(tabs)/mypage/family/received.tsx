import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DodoColors } from '@/constants/theme';

import { MOCK_BLOCKED, MOCK_RECEIVED_REQUESTS, type ReceivedRequestStatus } from './_mock';

const FILTERS: ReceivedRequestStatus[] = ['승인 대기', '거절됨'];

export default function FamilyReceivedScreen() {
  const [filter, setFilter] = useState<ReceivedRequestStatus>('승인 대기');
  const filteredRequests = MOCK_RECEIVED_REQUESTS.filter((r) => r.status === filter);

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

        {filteredRequests.length === 0 ? (
          <Text style={styles.emptyText}>아직 받은 신청이 없어요.</Text>
        ) : (
          filteredRequests.map((request) => (
            <View key={request.id} style={styles.requestRow}>
              <Text style={styles.requestPetName}>{request.petName}</Text>
              <Text style={styles.requestDate}>{request.sentAt}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.infoLabel}>차단 목록</Text>
        {MOCK_BLOCKED.length === 0 ? (
          <Text style={styles.emptyText}>선택한 반려동물의 차단 목록이 비어 있어요.</Text>
        ) : (
          MOCK_BLOCKED.map((entry) => (
            <View key={entry.id} style={styles.requestRow}>
              <Text style={styles.requestPetName}>{entry.petName}</Text>
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
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: DodoColors.background,
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
});
