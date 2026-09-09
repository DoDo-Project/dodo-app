import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DodoColors } from '@/constants/theme';
import { createInvitationCode, getPendingUsers } from '@/shared/api/familyApi';
import { getPetDetail, getPetListName, getPetsList } from '@/shared/api/petApi';
import { getInvitationCode, saveInvitationCode } from '@/shared/lib/family/invitationCodeCache';

export default function FamilyScreen() {
  const petsQuery = useQuery({ queryKey: ['pets', 'list'], queryFn: () => getPetsList(0, 10) });
  const pets = useMemo(() => petsQuery.data?.pets ?? [], [petsQuery.data]);

  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  useEffect(() => {
    if (selectedPetId === null && pets.length > 0) setSelectedPetId(pets[0].petId);
  }, [pets, selectedPetId]);

  const petDetailQuery = useQuery({
    queryKey: ['pets', selectedPetId],
    queryFn: () => getPetDetail(selectedPetId as number),
    enabled: selectedPetId !== null,
  });

  const pendingQuery = useQuery({
    queryKey: ['family', 'pending-users'],
    queryFn: () => getPendingUsers('PENDING'),
  });

  const receivedCount = (pendingQuery.data?.users ?? []).filter((u) => u.petId === selectedPetId).length;

  const [cachedCode, setCachedCode] = useState<{ code: string; expiresAt: number } | null>(null);
  useEffect(() => {
    if (selectedPetId === null) return;
    getInvitationCode(selectedPetId).then(setCachedCode);
  }, [selectedPetId]);

  const inviteMutation = useMutation({
    mutationFn: () => createInvitationCode(selectedPetId as number),
    onSuccess: async ({ code, expiresIn }) => {
      await saveInvitationCode(selectedPetId as number, code, expiresIn);
      setCachedCode({ code, expiresAt: Date.now() + expiresIn * 1000 });
      Alert.alert(
        '초대 코드 발급',
        `${selectedPet ? getPetListName(selectedPet) : ''}의 초대 코드가 발급됐어요.\n\n${code}`,
      );
    },
    onError: () => Alert.alert('오류', '초대 코드를 발급하지 못했어요.'),
  });

  const selectedPet = pets.find((p) => p.petId === selectedPetId) ?? null;
  const members = petDetailQuery.data?.familyMembers ?? [];

  if (petsQuery.isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator color={DodoColors.brand} />
      </View>
    );
  }

  if (pets.length === 0 || !selectedPet) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="paw-outline" size={40} color={DodoColors.fenceIdleLabel} />
        <Text style={styles.emptyText}>가족을 관리하려면 먼저 반려동물을 등록해주세요.</Text>
        <Link href="/(tabs)/mypage/pets/new" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>반려동물 추가하기</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>FAMILY</Text>
      <Text style={styles.title}>반려동물 가족 관리</Text>

      <View style={styles.card}>
        <Text style={styles.infoLabel}>SELECT PET</Text>
        <Text style={styles.sectionHint}>가족을 관리할 반려동물을 선택해 주세요</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {pets.map((pet) => {
            const selected = pet.petId === selectedPetId;
            return (
              <TouchableOpacity
                key={pet.petId}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setSelectedPetId(pet.petId)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{getPetListName(pet)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.card}>
        <View style={styles.petRow}>
          <View style={styles.petAvatar}>
            <Ionicons name="paw" size={24} color={DodoColors.brandForeground} />
          </View>
          <View style={styles.petTextCol}>
            <View style={styles.petNameRow}>
              <Text style={styles.petName}>{getPetListName(selectedPet)}</Text>
              <View style={styles.familyCountBadge}>
                <Text style={styles.familyCountBadgeText}>가족 {members.length}명</Text>
              </View>
            </View>
            <Text style={styles.petMeta}>만 {selectedPet.age}세</Text>
            <Text style={styles.petMeta}>
              {selectedPet.species === 'CANINE' ? '강아지' : '고양이'} {selectedPet.breed}
            </Text>
          </View>
          <Link
            href={{ pathname: '/(tabs)/mypage/pets/[petId]', params: { petId: String(selectedPet.petId) } }}
            asChild
          >
            <TouchableOpacity style={styles.outlineButton}>
              <Text style={styles.outlineButtonText}>상세정보</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.infoLabel}>가족 구성원</Text>
        {members.length === 0 ? (
          <Text style={styles.hintText}>아직 가족 구성원이 없어요.</Text>
        ) : (
          <View style={styles.memberGrid}>
            {members.map((member) => (
              <View key={member.userId} style={styles.memberItem}>
                {member.profileImageUrl ? (
                  <Image source={{ uri: member.profileImageUrl }} style={styles.memberAvatarImage} contentFit="cover" />
                ) : (
                  <View style={styles.memberAvatar}>
                    <Ionicons name="person" size={20} color={DodoColors.brandForeground} />
                  </View>
                )}
                <Text style={styles.memberName} numberOfLines={1}>
                  {member.userName}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.cardRow}>
        <View style={[styles.card, styles.cardHalf]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.infoLabel}>가족 신청</Text>
            <Link href="/(tabs)/mypage/family/apply" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>전체보기</Text>
              </TouchableOpacity>
            </Link>
          </View>
          <Text style={styles.hintText}>새로운 가족을 만나보세요! 전체보기에서 확인할 수 있어요.</Text>
        </View>

        <View style={[styles.card, styles.cardHalf]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.infoLabel}>받은 신청 목록</Text>
            <Link href="/(tabs)/mypage/family/received" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>전체보기</Text>
              </TouchableOpacity>
            </Link>
          </View>
          <Text style={styles.hintText}>
            {receivedCount === 0 ? '아직 받은 신청이 없어요.' : `${receivedCount}건의 신청이 있어요.`}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.infoLabel}>초대 코드 발급</Text>
        <Text style={styles.hintText}>
          선택한 반려동물 기준으로 초대 코드를 발급할 수 있어요.{'\n'}발급된 코드는 만료 전까지 이 화면에서 다시 볼 수
          있어요.
        </Text>
        {cachedCode && (
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{cachedCode.code}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.primaryButton}
          disabled={inviteMutation.isPending}
          onPress={() => inviteMutation.mutate()}
        >
          <Text style={styles.primaryButtonText}>
            {inviteMutation.isPending ? '발급 중...' : cachedCode ? '초대 코드 다시 만들기' : '초대 코드 만들기'}
          </Text>
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
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
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
    marginBottom: 4,
  },
  card: {
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    padding: 16,
    gap: 8,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardHalf: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: DodoColors.fenceIdleLabel,
    letterSpacing: 0.3,
  },
  sectionHint: {
    fontSize: 12,
    color: DodoColors.textSecondary,
    marginTop: -4,
  },
  chipRow: {
    marginTop: 4,
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
  petRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  petAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: DodoColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petTextCol: {
    flex: 1,
    gap: 2,
  },
  petNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  petName: {
    fontSize: 15,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  familyCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#fdead9',
  },
  familyCountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: DodoColors.brand,
  },
  petMeta: {
    fontSize: 11,
    color: DodoColors.textSecondary,
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
  memberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  memberItem: {
    width: 56,
    alignItems: 'center',
    gap: 4,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DodoColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DodoColors.background,
  },
  memberName: {
    fontSize: 11,
    color: DodoColors.textPrimary,
    textAlign: 'center',
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
  hintText: {
    fontSize: 11,
    lineHeight: 16,
    color: DodoColors.fenceIdleLabel,
  },
  codeBox: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: DodoColors.background,
    borderWidth: 1,
    borderColor: DodoColors.border,
  },
  codeText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    color: DodoColors.textPrimary,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: DodoColors.brand,
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: DodoColors.brandForeground,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyText: {
    fontSize: 13,
    color: DodoColors.fenceIdleLabel,
    textAlign: 'center',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: DodoColors.brand,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: DodoColors.brandForeground,
  },
});
