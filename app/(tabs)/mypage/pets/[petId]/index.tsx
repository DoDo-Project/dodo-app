import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DodoColors } from '@/constants/theme';
import { getPetDetail, getWeightHistory, leavePetFamily, type PetActivity } from '@/shared/api/petApi';
import { formatFullDateTime } from '@/shared/lib/format/date';

const NOTE_TYPE_LABEL: Record<string, string> = {
  ALLERGY: '알레르기',
  HOSPITAL: '병원',
  MEDICATION: '약물',
  FOOD: '음식',
  BEHAVIOR: '행동',
  SYMPTOM: '증상',
  ETC: '기타',
};

// 백엔드가 measuredAt 외에 어떤 필드를 더 주는지 확정되지 않아, 알려진 키는 한글 라벨로 보여주고 나머지는 원래 키를 그대로 보여준다.
const ACTIVITY_FIELD_LABEL: Record<string, string> = {
  activityType: '활동 종류',
  distance: '이동 거리',
  duration: '소요 시간',
  steps: '걸음 수',
  calories: '소모 칼로리',
  heartRate: '심박수',
  avgHeartRate: '평균 심박수',
};

function speciesLabel(species: 'CANINE' | 'FELINE') {
  return species === 'CANINE' ? '강아지' : '고양이';
}

function LastActivitySummary({ activity }: { activity: PetActivity }) {
  const { measuredAt, ...rest } = activity;
  const entries = Object.entries(rest).filter(([, value]) => value !== null && value !== undefined && value !== '');

  return (
    <View style={styles.activityCol}>
      {measuredAt && <Text style={styles.activityDate}>{formatFullDateTime(measuredAt)}</Text>}
      {entries.length === 0 ? (
        <Text style={styles.emptyText}>세부 활동 정보가 없어요.</Text>
      ) : (
        entries.map(([key, value]) => (
          <View key={key} style={styles.activityRow}>
            <Text style={styles.activityKey}>{ACTIVITY_FIELD_LABEL[key] ?? key}</Text>
            <Text style={styles.activityValue}>{String(value)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

export default function PetDetailScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const petQuery = useQuery({ queryKey: ['pets', petId], queryFn: () => getPetDetail(petId), enabled: !!petId });
  const weightQuery = useQuery({
    queryKey: ['pets', petId, 'weight', 'preview'],
    queryFn: () => getWeightHistory(petId, 0, 1),
    enabled: !!petId,
  });

  const leaveMutation = useMutation({
    mutationFn: () => leavePetFamily(petId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets', 'list'] });
      router.replace('/(tabs)/mypage/pets');
    },
    onError: () => Alert.alert('오류', '가족 나가기에 실패했어요.'),
  });

  const handleLeaveFamily = () => {
    Alert.alert('가족 나가기', `${pet?.petName}의 가족에서 나가시겠어요?`, [
      { text: '취소', style: 'cancel' },
      { text: '나가기', style: 'destructive', onPress: () => leaveMutation.mutate() },
    ]);
  };

  if (petQuery.isLoading || !petQuery.data) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator color={DodoColors.brand} />
      </View>
    );
  }

  const pet = petQuery.data;
  const latestWeight = weightQuery.data?.records?.[0];
  const notes = pet.specialNotes ?? [];
  const familyMembers = pet.familyMembers ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>PET DETAIL</Text>
          <Text style={styles.title}>반려동물 상세정보</Text>
        </View>
        <View style={styles.topRowActions}>
          <TouchableOpacity style={styles.outlineButton} onPress={() => router.back()}>
            <Text style={styles.outlineButtonText}>목록으로</Text>
          </TouchableOpacity>
          <Link href={{ pathname: '/(tabs)/mypage/pets/[petId]/edit', params: { petId } }} asChild>
            <TouchableOpacity style={styles.outlineButton}>
              <Text style={styles.outlineButtonText}>정보 수정</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.petHeaderRow}>
          <View style={styles.petAvatar}>
            <Ionicons name="paw" size={26} color={DodoColors.brandForeground} />
          </View>
          <View style={styles.petHeaderTextCol}>
            <View style={styles.petNameRow}>
              <Text style={styles.petName}>{pet.petName}</Text>
              {pet.sex !== 'NEUTER' && (
                <Ionicons
                  name={pet.sex === 'FEMALE' ? 'female' : 'male'}
                  size={16}
                  color={pet.sex === 'FEMALE' ? '#ec4899' : '#3b82f6'}
                />
              )}
            </View>
            <Text style={styles.petMeta}>
              {pet.birth?.slice(0, 10)} (만 {pet.age}세)
            </Text>
            <Text style={styles.petMeta}>
              {speciesLabel(pet.species)} {pet.breed}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.infoLabel}>기본 정보</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>동물등록번호</Text>
          <Text style={styles.infoValue}>{pet.registrationNumber ?? '미등록'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>디바이스 ID</Text>
          <Text style={styles.infoValue}>{pet.deviceId}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>기준 심박수</Text>
          <Text style={styles.infoValue}>{pet.referenceHeartRate}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.infoLabel}>체중 정보</Text>
          <Link href={{ pathname: '/(tabs)/mypage/pets/[petId]/weight', params: { petId } }} asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>전체보기</Text>
            </TouchableOpacity>
          </Link>
        </View>
        {latestWeight ? (
          <View style={styles.weightRow}>
            <Text style={styles.weightValue}>{latestWeight.weight}kg</Text>
            <Text style={styles.weightDate}>최근 측정일 {latestWeight.petWeightsMeasuredAt?.slice(0, 10)}</Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>등록된 체중 기록이 없어요.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.infoLabel}>가족 구성원</Text>
        {familyMembers.length === 0 ? (
          <Text style={styles.emptyText}>가족 구성원이 없어요.</Text>
        ) : (
          <View style={styles.familyGrid}>
            {familyMembers.map((member) => (
              <View key={member.userId} style={styles.familyItem}>
                {member.profileImageUrl ? (
                  <Image source={{ uri: member.profileImageUrl }} style={styles.familyAvatarImage} contentFit="cover" />
                ) : (
                  <View style={styles.familyAvatar}>
                    <Ionicons name="person" size={18} color={DodoColors.brandForeground} />
                  </View>
                )}
                <Text style={styles.familyName} numberOfLines={1}>
                  {member.userName}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.infoLabel}>최근 활동</Text>
        {pet.lastActivity ? (
          <LastActivitySummary activity={pet.lastActivity} />
        ) : (
          <Text style={styles.emptyText}>최근 활동 정보가 없습니다.</Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.infoLabel}>특이사항</Text>
          <Link href={{ pathname: '/(tabs)/mypage/pets/[petId]/notes', params: { petId } }} asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>전체보기</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <Text style={styles.notesSummary}>총 {pet.specialNotesCount}개의 특이사항이 등록되어 있어요.</Text>
        {notes.slice(0, 3).map((note) => (
          <View key={note.noteId} style={styles.noteRow}>
            <View style={styles.noteTag}>
              <Text style={styles.noteTagText}>{NOTE_TYPE_LABEL[note.noteType] ?? note.noteType}</Text>
            </View>
            <Text style={styles.noteDate}>{note.createdAt?.slice(0, 10)}</Text>
            <Text style={styles.noteContent} numberOfLines={1}>
              {note.noteContent}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.infoLabel}>펫 가족 나가기</Text>
        <Text style={styles.leaveHint}>
          가족에서 나가면 이 반려동물의 가족 구성원 목록과 관련 활동 기록을 더 이상 확인할 수 없어요. 다시 참여하려면
          초대 코드를 다시 등록해야 해요.
        </Text>
        <TouchableOpacity style={styles.leaveButton} disabled={leaveMutation.isPending} onPress={handleLeaveFamily}>
          <Text style={styles.leaveButtonText}>가족 나가기</Text>
        </TouchableOpacity>
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
  topRowActions: {
    flexDirection: 'row',
    gap: 8,
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
    gap: 10,
  },
  petHeaderRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  petAvatar: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: DodoColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petHeaderTextCol: {
    gap: 3,
  },
  petNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  petName: {
    fontSize: 17,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  petMeta: {
    fontSize: 12,
    color: DodoColors.textSecondary,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: DodoColors.brand,
    letterSpacing: 0.3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkText: {
    fontSize: 11,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoKey: {
    fontSize: 12,
    color: DodoColors.fenceIdleLabel,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.textPrimary,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  weightValue: {
    fontSize: 22,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  weightDate: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
  },
  familyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  familyItem: {
    width: 56,
    alignItems: 'center',
    gap: 4,
  },
  familyAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DodoColors.background,
  },
  familyName: {
    fontSize: 11,
    color: DodoColors.textPrimary,
    textAlign: 'center',
  },
  familyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DodoColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: DodoColors.fenceIdleLabel,
  },
  activityCol: {
    gap: 6,
  },
  activityDate: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityKey: {
    fontSize: 12,
    color: DodoColors.textSecondary,
  },
  activityValue: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.textPrimary,
  },
  notesSummary: {
    fontSize: 12,
    color: DodoColors.textSecondary,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: DodoColors.background,
  },
  noteTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: DodoColors.textSecondary,
  },
  noteDate: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
  },
  noteContent: {
    flex: 1,
    fontSize: 12,
    color: DodoColors.textPrimary,
  },
  leaveHint: {
    fontSize: 11,
    lineHeight: 16,
    color: DodoColors.fenceIdleLabel,
  },
  leaveButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DodoColors.fenceOutside,
  },
  leaveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.fenceOutside,
  },
});
