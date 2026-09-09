import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { DodoColors } from '@/constants/theme';
import { sendWithdrawalEmail, withdrawUser } from '@/shared/api/userApi';
import { useAuthStore } from '@/shared/lib/auth/authStore';

const COOLDOWN_SECONDS = 60;

export default function WithdrawalScreen() {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);
  const [step, setStep] = useState<1 | 2>(1);
  const [authCode, setAuthCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(COOLDOWN_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const sendEmailMutation = useMutation({
    mutationFn: sendWithdrawalEmail,
    onSuccess: () => {
      setStep(2);
      startCooldown();
      Alert.alert('인증 메일 발송', '입력하신 이메일로 인증 코드를 보냈어요.');
    },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 429) {
        Alert.alert('잠시만요', '1분 내 재요청은 제한돼요. 잠시 후 다시 시도해주세요.');
        startCooldown();
        return;
      }
      Alert.alert('오류', '인증 메일 발송에 실패했어요.');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () => withdrawUser(authCode.trim()),
    onSuccess: async () => {
      await clearSession();
      router.replace('/(tabs)');
    },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 400 || status === 401) {
        Alert.alert('인증 실패', '인증번호가 틀렸습니다.');
        return;
      }
      Alert.alert('오류', '회원 탈퇴에 실패했어요.');
    },
  });

  const confirmWithdraw = () => {
    if (authCode.trim().length !== 6) return;
    Alert.alert('회원 탈퇴', '탈퇴하면 계정과 모든 데이터가 삭제되며 되돌릴 수 없어요. 계속하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '탈퇴하기', style: 'destructive', onPress: () => withdrawMutation.mutate() },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>ACCOUNT</Text>
      <Text style={styles.title}>회원 탈퇴</Text>
      <Text style={styles.subtitle}>탈퇴하면 계정과 모든 데이터가 삭제되며 되돌릴 수 없어요.</Text>

      <View style={styles.card}>
        <Text style={styles.stepLabel}>STEP 1 · 이메일 인증</Text>
        <Text style={styles.stepHint}>가입한 이메일로 인증 코드를 보내드려요.</Text>
        <TouchableOpacity
          style={[styles.primaryButton, (cooldown > 0 || sendEmailMutation.isPending) && styles.primaryButtonDisabled]}
          disabled={cooldown > 0 || sendEmailMutation.isPending}
          onPress={() => sendEmailMutation.mutate()}
        >
          <Text style={styles.primaryButtonText}>
            {cooldown > 0
              ? `${cooldown}초 후 재발송 가능`
              : sendEmailMutation.isPending
                ? '발송 중...'
                : '인증 메일 발송'}
          </Text>
        </TouchableOpacity>
      </View>

      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.stepLabel}>STEP 2 · 인증 코드 입력</Text>
          <Text style={styles.stepHint}>메일로 받은 6자리 코드를 입력해주세요.</Text>
          <TextInput
            style={styles.input}
            placeholder="6자리 코드"
            placeholderTextColor={DodoColors.fenceIdleLabel}
            value={authCode}
            onChangeText={setAuthCode}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity
            style={[
              styles.dangerButton,
              (authCode.trim().length !== 6 || withdrawMutation.isPending) && styles.primaryButtonDisabled,
            ]}
            disabled={authCode.trim().length !== 6 || withdrawMutation.isPending}
            onPress={confirmWithdraw}
          >
            <Text style={styles.dangerButtonText}>{withdrawMutation.isPending ? '처리 중...' : '회원 탈퇴하기'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DodoColors.background,
    padding: 16,
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
  },
  subtitle: {
    fontSize: 12,
    color: DodoColors.textSecondary,
    marginBottom: 4,
  },
  card: {
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    padding: 16,
    gap: 10,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: DodoColors.fenceIdleLabel,
    letterSpacing: 0.3,
  },
  stepHint: {
    fontSize: 12,
    color: DodoColors.textSecondary,
    marginTop: -4,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.background,
    paddingHorizontal: 12,
    fontSize: 14,
    color: DodoColors.textPrimary,
  },
  primaryButton: {
    height: 44,
    borderRadius: 10,
    backgroundColor: DodoColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: DodoColors.brandForeground,
  },
  dangerButton: {
    height: 44,
    borderRadius: 10,
    backgroundColor: DodoColors.fenceOutside,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
