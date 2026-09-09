import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { RegionSelectModal } from '@/components/auth/region-select-modal';
import { AvatarImagePicker } from '@/components/common/avatar-image-picker';
import { DodoColors } from '@/constants/theme';
import { getMe, updateMe } from '@/shared/api/userApi';
import { useAuthStore } from '@/shared/lib/auth/authStore';

export default function ProfileEditScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [nickname, setNickname] = useState('');
  const [region, setRegion] = useState('');
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);

  const meQuery = useQuery({ queryKey: ['users', 'me'], queryFn: getMe });

  useEffect(() => {
    if (meQuery.data) setProfileUrl(meQuery.data.profileUrl);
  }, [meQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!meQuery.data) throw new Error('not loaded');
      return updateMe({
        nickname: nickname.trim() || meQuery.data.nickname,
        region: region.trim() || meQuery.data.region,
        hasFamily: meQuery.data.hasFamily,
        profileUrl,
      });
    },
    onSuccess: () => {
      updateProfile({
        nickname: nickname.trim() || meQuery.data?.nickname,
        region: region.trim() || meQuery.data?.region,
        profileUrl,
      });
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      Alert.alert('저장 완료', '변경사항이 저장됐어요.');
      setNickname('');
      setRegion('');
    },
    onError: () => Alert.alert('오류', '저장에 실패했어요. 잠시 후 다시 시도해주세요.'),
  });

  const handleWithdrawal = () => {
    router.push('/(tabs)/mypage/withdrawal');
  };

  if (meQuery.isLoading || !meQuery.data) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator color={DodoColors.brand} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>ACCOUNT</Text>
      <Text style={styles.title}>회원정보 수정</Text>

      <View style={styles.card}>
        <View style={styles.imageRow}>
          <AvatarImagePicker imageUrl={profileUrl} onUploaded={setProfileUrl} size={64} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>기본 정보</Text>
        <Text style={styles.sectionHint}>
          이메일과 이름은 조회만 가능하고, 닉네임과 활동 지역은 이 화면에서 수정할 수 있어요.
        </Text>

        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>이메일</Text>
            <View style={styles.readonlyInput}>
              <Text style={styles.readonlyValue}>{meQuery.data.email}</Text>
            </View>
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>이름</Text>
            <View style={styles.readonlyInput}>
              <Text style={styles.readonlyValue}>{meQuery.data.name}</Text>
            </View>
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>닉네임 *</Text>
            <TextInput
              style={styles.input}
              placeholder={meQuery.data.nickname}
              placeholderTextColor={DodoColors.fenceIdleLabel}
              value={nickname}
              onChangeText={setNickname}
            />
            <Text style={styles.fieldHint}>비워두면 현재 닉네임을 그대로 유지해요.</Text>
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>활동 지역 *</Text>
            <TouchableOpacity style={styles.readonlyInput} onPress={() => setRegionModalVisible(true)}>
              <Text style={region ? styles.readonlyValue : styles.fieldHint}>{region || meQuery.data.region}</Text>
            </TouchableOpacity>
            <Text style={styles.fieldHint}>눌러서 활동 지역을 선택해주세요.</Text>
          </View>
        </View>

        <RegionSelectModal
          visible={regionModalVisible}
          initialRegion={region || meQuery.data.region}
          onClose={() => setRegionModalVisible(false)}
          onConfirm={setRegion}
        />

        <Text style={styles.requiredHint}>* 표시된 항목은 필수 입력값입니다.</Text>

        <TouchableOpacity
          style={styles.saveButton}
          disabled={saveMutation.isPending}
          onPress={() => saveMutation.mutate()}
        >
          <Text style={styles.saveButtonText}>{saveMutation.isPending ? '저장 중...' : '변경사항 저장'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>회원 탈퇴</Text>
        <Text style={styles.sectionHint}>탈퇴하면 계정과 모든 데이터가 삭제되며 되돌릴 수 없어요.</Text>
        <TouchableOpacity style={styles.withdrawalButton} onPress={handleWithdrawal}>
          <Text style={styles.withdrawalButtonText}>회원 탈퇴</Text>
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
    gap: 16,
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
    gap: 12,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: DodoColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageTextCol: {
    flex: 1,
    gap: 4,
  },
  imageBadgeRow: {
    flexDirection: 'row',
  },
  imageBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: DodoColors.textSecondary,
    backgroundColor: DodoColors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  imageHint: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
    lineHeight: 16,
  },
  imageButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DodoColors.border,
    marginTop: 4,
  },
  imageButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  sectionHint: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
    marginTop: -8,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldHalf: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.background,
    paddingHorizontal: 12,
    fontSize: 13,
    color: DodoColors.textPrimary,
  },
  fieldHint: {
    fontSize: 10,
    color: DodoColors.fenceIdleLabel,
  },
  readonlyInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.background,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  readonlyValue: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.textPrimary,
  },
  requiredHint: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
  },
  saveButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: DodoColors.brand,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: DodoColors.brandForeground,
  },
  withdrawalButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DodoColors.fenceOutside,
  },
  withdrawalButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.fenceOutside,
  },
});
