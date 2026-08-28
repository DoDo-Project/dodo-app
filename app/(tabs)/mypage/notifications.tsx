import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DodoColors } from '@/constants/theme';
import { getMe, updateNotificationSetting } from '@/shared/api/userApi';
import { useAuthStore } from '@/shared/lib/auth/authStore';

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const meQuery = useQuery({ queryKey: ['users', 'me'], queryFn: getMe });

  const mutation = useMutation({
    mutationFn: (enabled: boolean) => updateNotificationSetting(enabled),
    onSuccess: (_, enabled) => {
      updateProfile({ notificationEnabled: enabled });
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });

  if (meQuery.isLoading || !meQuery.data) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={DodoColors.brand} />
      </View>
    );
  }

  const enabled = meQuery.data.notificationEnabled;

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>NOTIFICATIONS</Text>
      <Text style={styles.title}>알림 설정</Text>
      <Text style={styles.subtitle}>산책, 건강, 가족 관리 등 주요 알림을 받아볼지 선택해주세요.</Text>

      <TouchableOpacity
        style={[styles.optionCard, enabled && styles.optionCardSelected]}
        disabled={mutation.isPending}
        onPress={() => mutation.mutate(true)}
      >
        <Ionicons
          name={enabled ? 'radio-button-on' : 'radio-button-off'}
          size={20}
          color={enabled ? DodoColors.brand : DodoColors.fenceIdleLabel}
        />
        <View style={styles.optionTextCol}>
          <Text style={styles.optionTitle}>알림 받기</Text>
          <Text style={styles.optionHint}>주요 소식과 활동 알림을 받아볼게요.</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionCard, !enabled && styles.optionCardSelected]}
        disabled={mutation.isPending}
        onPress={() => mutation.mutate(false)}
      >
        <Ionicons
          name={!enabled ? 'radio-button-on' : 'radio-button-off'}
          size={20}
          color={!enabled ? DodoColors.brand : DodoColors.fenceIdleLabel}
        />
        <View style={styles.optionTextCol}>
          <Text style={styles.optionTitle}>지금은 받지 않기</Text>
          <Text style={styles.optionHint}>나중에 이 화면에서 다시 켤 수 있어요.</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DodoColors.background,
    padding: 16,
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
  },
  subtitle: {
    fontSize: 12,
    color: DodoColors.textSecondary,
    marginBottom: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: DodoColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DodoColors.border,
    padding: 16,
  },
  optionCardSelected: {
    borderColor: DodoColors.brand,
  },
  optionTextCol: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  optionHint: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
  },
});
