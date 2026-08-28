import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DodoColors } from '@/constants/theme';
import { getMain } from '@/shared/api/mainApi';
import { useAuthStore } from '@/shared/lib/auth/authStore';

// 공지사항 UI는 웹에서도 죽은 데이터(announcement 필드가 화면에 렌더되지 않음)라 목데이터를 그대로 유지한다.
const MOCK_NOTICES: { tag: '안내' | '긴급'; title: string }[] = [
  { tag: '안내', title: '겨울 시즌 산책 챌린지 오픈!' },
  { tag: '긴급', title: '일부 알림 지연 현상 안내' },
  { tag: '안내', title: '산책 중 위험 지역 사용자 제보 요청' },
  { tag: '안내', title: '반려동물 프로필 개선 업데이트' },
];

function sexLabel(sex: 'MALE' | 'FEMALE' | 'NEUTER') {
  if (sex === 'MALE') return '수컷';
  if (sex === 'FEMALE') return '암컷';
  return '중성화';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);

  const mainQuery = useQuery({
    queryKey: ['main'],
    queryFn: getMain,
    enabled: isAuthenticated,
  });

  const petProfiles = mainQuery.data?.petProfiles ?? [];
  const activePetId = selectedPetId ?? petProfiles[0]?.petId ?? null;
  const selectedPet = petProfiles.find((p) => p.petId === activePetId) ?? null;

  const latestReport = useMemo(() => {
    const reports = (mainQuery.data?.healthReports ?? []).filter((r) => r.petId === activePetId);
    if (reports.length === 0) return null;
    return [...reports].sort((a, b) => (a.checkupDate < b.checkupDate ? 1 : -1))[0];
  }, [mainQuery.data, activePetId]);

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={[styles.content, styles.guestContent, { paddingTop: insets.top + 16 }]}>
          <Ionicons name="paw" size={40} color={DodoColors.secondary} />
          <Text style={styles.guestTitle}>DoDo에 오신 걸 환영해요</Text>
          <Text style={styles.guestSubtitle}>로그인하면 반려동물의 건강 리포트와 산책 정보를 확인할 수 있어요.</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/auth' as Href)}>
            <Text style={styles.loginButtonText}>로그인하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (mainQuery.isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator color={DodoColors.brand} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        {/* AI 건강 레포트 */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="folder-outline" size={18} color={DodoColors.textPrimary} />
            <Text style={styles.cardHeaderText}>AI 건강 레포트</Text>
          </View>

          <View style={styles.reportIllustration}>
            <Ionicons name="paw" size={48} color={DodoColors.secondary} />
          </View>

          {latestReport ? (
            <>
              <Text style={styles.reportTitle}>{latestReport.healthReportTitle}</Text>
              <Text style={styles.reportDescription}>{latestReport.healthReportSummary}</Text>
            </>
          ) : (
            <>
              <Text style={styles.reportTitle}>{selectedPet?.name ?? '반려동물'}의 건강 데이터를 분석 중이에요.</Text>
              <Text style={styles.reportDescription}>
                {selectedPet?.name ?? '반려동물'}의 첫 건강 레포트를 만들 수 있도록 산책과 건강 기록을 조금 더
                쌓아보세요.
              </Text>
            </>
          )}

          <TouchableOpacity style={styles.reportLinkRow}>
            <Text style={styles.reportLinkText}>{latestReport ? '레포트 자세히 보기' : '레포트 준비 중'}</Text>
            <Ionicons name="chevron-forward" size={14} color={DodoColors.fenceIdleLabel} />
          </TouchableOpacity>
        </View>

        {/* 펫 카드 */}
        {selectedPet && (
          <View style={styles.card}>
            <View style={styles.petHeaderRow}>
              <View style={styles.petAvatar}>
                <Ionicons name="paw" size={28} color={DodoColors.brandForeground} />
              </View>
              <View style={styles.petNameCol}>
                <Text style={styles.petName}>{selectedPet.name}</Text>
              </View>
              <View style={styles.ageBadge}>
                <Text style={styles.ageBadgeText}>만 {selectedPet.age}세</Text>
              </View>
            </View>

            <View style={styles.petStatsRow}>
              <View style={styles.petStatItem}>
                <Text style={styles.petStatLabel}>품종</Text>
                <Text style={styles.petStatValue}>{selectedPet.breed}</Text>
              </View>
              <View style={styles.petStatItem}>
                <Text style={styles.petStatLabel}>체중</Text>
                <Text style={styles.petStatValue}>{selectedPet.weight} kg</Text>
              </View>
              <View style={styles.petStatItem}>
                <Text style={styles.petStatLabel}>성별</Text>
                <Text style={styles.petStatValue}>{sexLabel(selectedPet.sex)}</Text>
              </View>
            </View>

            {petProfiles.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailRow}>
                {petProfiles.map((pet) => (
                  <TouchableOpacity
                    key={pet.petId}
                    style={[styles.thumbnail, pet.petId === activePetId && styles.thumbnailSelected]}
                    onPress={() => setSelectedPetId(pet.petId)}
                  >
                    <Ionicons name="paw-outline" size={20} color={DodoColors.fenceIdleLabel} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* 공지사항 */}
        <View style={styles.card}>
          <View style={styles.noticeHeaderRow}>
            <Text style={styles.noticeHeaderText}>공지사항</Text>
            <TouchableOpacity>
              <Ionicons name="add" size={20} color={DodoColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {MOCK_NOTICES.map((notice, index) => (
            <View
              key={notice.title}
              style={[styles.noticeRow, index === MOCK_NOTICES.length - 1 && styles.noticeRowLast]}
            >
              <View style={[styles.noticeTag, notice.tag === '긴급' && styles.noticeTagUrgent]}>
                <Text style={[styles.noticeTagText, notice.tag === '긴급' && styles.noticeTagTextUrgent]}>
                  {notice.tag}
                </Text>
              </View>
              <Text style={styles.noticeTitle} numberOfLines={1}>
                {notice.title}
              </Text>
            </View>
          ))}
        </View>
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
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  guestContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 32,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DodoColors.textPrimary,
    marginTop: 8,
  },
  guestSubtitle: {
    fontSize: 13,
    color: DodoColors.textSecondary,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: DodoColors.brand,
  },
  loginButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: DodoColors.brandForeground,
  },
  card: {
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: DodoColors.textPrimary,
  },
  reportIllustration: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DodoColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  reportTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: DodoColors.textPrimary,
    marginBottom: 6,
  },
  reportDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: DodoColors.textSecondary,
  },
  reportLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    marginTop: 12,
  },
  reportLinkText: {
    fontSize: 12,
    color: DodoColors.fenceIdleLabel,
  },
  petHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  petAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DodoColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petNameCol: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  ageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: DodoColors.background,
    borderWidth: 1,
    borderColor: DodoColors.border,
  },
  ageBadgeText: {
    fontSize: 12,
    color: DodoColors.textSecondary,
  },
  petStatsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
  },
  petStatItem: {
    gap: 4,
  },
  petStatLabel: {
    fontSize: 12,
    color: DodoColors.fenceIdleLabel,
  },
  petStatValue: {
    fontSize: 15,
    fontWeight: '600',
    color: DodoColors.textPrimary,
  },
  thumbnailRow: {
    marginTop: 16,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: DodoColors.background,
    borderWidth: 1,
    borderColor: DodoColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  thumbnailSelected: {
    borderColor: DodoColors.secondary,
    borderWidth: 2,
  },
  noticeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noticeHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DodoColors.background,
  },
  noticeRowLast: {
    borderBottomWidth: 0,
  },
  noticeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#dcfce7',
  },
  noticeTagUrgent: {
    backgroundColor: '#fee2e2',
  },
  noticeTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: DodoColors.fenceActiveLabel,
  },
  noticeTagTextUrgent: {
    color: DodoColors.fenceOutside,
  },
  noticeTitle: {
    flex: 1,
    fontSize: 14,
    color: DodoColors.textPrimary,
  },
});
