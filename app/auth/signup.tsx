import Ionicons from '@expo/vector-icons/Ionicons';
import { isAxiosError } from 'axios';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ReactNode, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarImagePicker } from '@/components/common/avatar-image-picker';
import { RegionSelectModal } from '@/components/auth/region-select-modal';
import { DodoColors } from '@/constants/theme';
import { registerProfile } from '@/shared/api/authApi';
import { checkNickname, updateNotificationSetting } from '@/shared/api/userApi';
import { useAuthStore } from '@/shared/lib/auth/authStore';

// 백엔드 명세 기준: 2~10자, 한글/영문/숫자/공백만 허용
const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9 ]{2,10}$/;

// generated route types omit the bare "/auth" index route (typegen quirk), but it's the only path that resolves at runtime
const AUTH_HREF = '/auth' as Href;

type Step = 'terms' | 'profile' | 'notification' | 'complete';
type NicknameStatus = 'idle' | 'valid' | 'invalid';

function StepLayout({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.stepContainer}>
      <ScrollView contentContainerStyle={[styles.stepContent, { paddingTop: insets.top + 24 }]}>{children}</ScrollView>
      <View style={[styles.stepFooter, { paddingBottom: insets.bottom + 16 }]}>{footer}</View>
    </View>
  );
}

function ChoiceRow({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.choiceRow} onPress={onPress}>
      <View style={[styles.choiceDot, selected && styles.choiceDotSelected]}>
        {selected && <Ionicons name="checkmark" size={12} color={DodoColors.brandForeground} />}
      </View>
      <Text style={styles.choiceLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function SignupScreen() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const params = useLocalSearchParams<{
    registrationToken: string;
    email?: string;
    name?: string;
    profileUrl?: string;
  }>();

  const registrationToken = params.registrationToken;

  const [step, setStep] = useState<Step>('terms');
  const [agreed, setAgreed] = useState(false);

  const [nickname, setNickname] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>('idle');
  const [nicknameErrorMessage, setNicknameErrorMessage] = useState('');
  const [checkingNickname, setCheckingNickname] = useState(false);

  const [region, setRegion] = useState('');
  const [regionModalVisible, setRegionModalVisible] = useState(false);

  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(params.profileUrl || null);

  const [allowNotification, setAllowNotification] = useState<boolean | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fatalError, setFatalError] = useState<string | null>(null);
  const profileCompletedRef = useRef(false);

  const handleChangeNickname = (value: string) => {
    setNickname(value);
    setNicknameStatus('idle');
    setNicknameErrorMessage('');
  };

  const handleCheckNickname = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setNicknameStatus('invalid');
      setNicknameErrorMessage('닉네임을 입력해주세요.');
      return;
    }
    if (!NICKNAME_REGEX.test(trimmed)) {
      setNicknameStatus('invalid');
      setNicknameErrorMessage('닉네임은 2~10자, 한글·영문·숫자, 띄어쓰기만 사용할 수 있어요.');
      return;
    }

    setCheckingNickname(true);
    setNicknameErrorMessage('');

    try {
      const result = await checkNickname(trimmed, registrationToken);
      if (result.duplicated) {
        setNicknameStatus('invalid');
        setNicknameErrorMessage('이미 사용 중인 닉네임이에요.');
        return;
      }
      setNicknameStatus('valid');
    } catch {
      setNicknameStatus('invalid');
      setNicknameErrorMessage('중복 확인에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setCheckingNickname(false);
    }
  };

  const canProceedProfile = nicknameStatus === 'valid' && region.trim().length > 0;

  // registerProfile → 알림 설정 저장 순으로 가입을 완료. ①이 이미 성공했으면 재시도 시 ②만 다시 호출.
  const handleSubmit = async () => {
    if (allowNotification === null || !registrationToken) return;

    setSubmitting(true);
    setError('');

    try {
      if (!profileCompletedRef.current) {
        const response = await registerProfile(
          {
            hasFamily: false,
            nickname: nickname.trim(),
            region: region.trim(),
            profileUrl: profileImageUrl,
          },
          registrationToken,
        );

        await setSession({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          accessTokenExpiresIn: response.accessTokenExpiresIn,
          profileUrl: response.profileUrl,
          nickname: nickname.trim(),
          region: region.trim(),
        });
        profileCompletedRef.current = true;
      }

      await updateNotificationSetting(allowNotification);
      await updateProfile({ notificationEnabled: allowNotification });
      setStep('complete');
    } catch (submitError) {
      if (profileCompletedRef.current) {
        setError('알림 설정 저장에 실패했어요. 다시 시도해주세요.');
        return;
      }

      const status = isAxiosError(submitError) ? submitError.response?.status : undefined;
      if (status === 401 || status === 409) {
        setFatalError('가입 세션이 만료됐거나 이미 사용 중인 정보가 있어요. 처음부터 다시 로그인해주세요.');
        return;
      }
      setError('회원가입에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!registrationToken) {
    return (
      <View style={[styles.stepContainer, styles.centerContent]}>
        <Text style={styles.errorTitle}>가입 정보가 없어요</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace(AUTH_HREF)}>
          <Text style={styles.primaryButtonText}>처음부터 로그인하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (fatalError) {
    return (
      <View style={[styles.stepContainer, styles.centerContent, { padding: 24 }]}>
        <Ionicons name="alert-circle-outline" size={40} color={DodoColors.fenceOutside} />
        <Text style={styles.errorTitle}>로그인이 필요해요</Text>
        <Text style={styles.errorMessage}>{fatalError}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace(AUTH_HREF)}>
          <Text style={styles.primaryButtonText}>처음부터 로그인하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'terms') {
    return (
      <StepLayout
        footer={
          <TouchableOpacity
            style={[styles.primaryButton, !agreed && styles.primaryButtonDisabled]}
            disabled={!agreed}
            onPress={() => setStep('profile')}
          >
            <Text style={styles.primaryButtonText}>다음</Text>
          </TouchableOpacity>
        }
      >
        <Ionicons name="paw" size={36} color={DodoColors.brand} />
        <Text style={styles.title}>약관에 동의해주세요</Text>
        <Text style={styles.subtitle}>
          서비스 이용에 필요한 필수 항목입니다.{'\n'}데이터는 약관에 따라 안전하게 보호되며,{'\n'}오직 서비스 개선과
          기능 제공에만 사용됩니다.
        </Text>

        <View style={styles.termsBlock}>
          <ChoiceRow selected={agreed} label="서비스 이용 약관에 동의합니다." onPress={() => setAgreed((v) => !v)} />
          {/* TODO(이슈X): 약관 상세 페이지 연결 — 웹도 아직 연결 안 되어있음 */}
          <View style={styles.termsLinksRow}>
            <Text style={styles.termsLink}>DoDo 이용 약관</Text>
            <Text style={styles.termsLink}>개인정보 제3자 이용 동의</Text>
          </View>
        </View>
      </StepLayout>
    );
  }

  if (step === 'profile') {
    return (
      <StepLayout
        footer={
          <TouchableOpacity
            style={[styles.primaryButton, !canProceedProfile && styles.primaryButtonDisabled]}
            disabled={!canProceedProfile}
            onPress={() => setStep('notification')}
          >
            <Text style={styles.primaryButtonText}>다음</Text>
          </TouchableOpacity>
        }
      >
        <Text style={styles.eyebrow}>SIGN UP</Text>
        <Text style={styles.title}>추가 정보 입력</Text>
        <Text style={styles.subtitle}>
          {params.name ? `${params.name}님, ` : ''}회원가입을 완료하려면 몇 가지 정보가 더 필요해요.
        </Text>

        <View style={styles.avatarRow}>
          <AvatarImagePicker
            imageUrl={profileImageUrl}
            onUploaded={setProfileImageUrl}
            authToken={registrationToken}
            size={88}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>이메일</Text>
          <View style={styles.readonlyInput}>
            <Text style={styles.readonlyValue}>{params.email}</Text>
          </View>

          <Text style={styles.label}>이름</Text>
          <View style={styles.readonlyInput}>
            <Text style={styles.readonlyValue}>{params.name}</Text>
          </View>

          <Text style={styles.label}>닉네임 *</Text>
          <View style={styles.inlineRow}>
            <TextInput
              style={[styles.input, styles.inlineInput]}
              placeholder="2~10자로 입력해주세요"
              placeholderTextColor={DodoColors.fenceIdleLabel}
              value={nickname}
              onChangeText={handleChangeNickname}
              maxLength={10}
            />
            <TouchableOpacity
              style={[styles.subButton, (!nickname.trim() || checkingNickname) && styles.subButtonDisabled]}
              disabled={!nickname.trim() || checkingNickname}
              onPress={handleCheckNickname}
            >
              {checkingNickname ? (
                <ActivityIndicator color={DodoColors.textSecondary} size="small" />
              ) : (
                <Text style={styles.subButtonText}>중복 확인</Text>
              )}
            </TouchableOpacity>
          </View>
          {nicknameStatus !== 'idle' && (
            <Text style={[styles.feedback, nicknameStatus === 'valid' ? styles.feedbackSuccess : styles.feedbackError]}>
              {nicknameStatus === 'valid' ? '사용 가능한 닉네임입니다.' : nicknameErrorMessage}
            </Text>
          )}

          <Text style={styles.label}>활동 지역 *</Text>
          <View style={styles.inlineRow}>
            <TouchableOpacity
              style={[styles.readonlyInput, styles.inlineInput]}
              onPress={() => setRegionModalVisible(true)}
            >
              <Text style={region ? styles.readonlyValue : styles.placeholderValue}>
                {region || '지역을 선택해주세요'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.subButton} onPress={() => setRegionModalVisible(true)}>
              <Text style={styles.subButtonText}>검색</Text>
            </TouchableOpacity>
          </View>
        </View>

        <RegionSelectModal
          visible={regionModalVisible}
          initialRegion={region}
          onClose={() => setRegionModalVisible(false)}
          onConfirm={setRegion}
        />
      </StepLayout>
    );
  }

  if (step === 'notification') {
    return (
      <StepLayout
        footer={
          <TouchableOpacity
            style={[styles.primaryButton, allowNotification === null && styles.primaryButtonDisabled]}
            disabled={allowNotification === null || submitting}
            onPress={handleSubmit}
          >
            {submitting ? (
              <ActivityIndicator color={DodoColors.brandForeground} />
            ) : (
              <Text style={styles.primaryButtonText}>다음</Text>
            )}
          </TouchableOpacity>
        }
      >
        <Ionicons name="notifications" size={36} color={DodoColors.brand} />
        <Text style={styles.title}>중요한 소식이 있을 때{'\n'}알려드릴까요?</Text>
        <Text style={styles.subtitle}>언제든지 설정에서 바꿀 수 있어요.</Text>

        <View style={styles.termsBlock}>
          <ChoiceRow
            selected={allowNotification === true}
            label="알림 받기"
            onPress={() => setAllowNotification(true)}
          />
          <ChoiceRow
            selected={allowNotification === false}
            label="지금은 안 받을래요"
            onPress={() => setAllowNotification(false)}
          />
        </View>

        {!!error && <Text style={[styles.feedback, styles.feedbackError]}>{error}</Text>}
      </StepLayout>
    );
  }

  return (
    <StepLayout
      footer={
        <View style={{ gap: 12 }}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(tabs)/mypage')}>
            <Text style={styles.primaryButtonText}>HOME</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.textLinkButton} onPress={() => router.replace('/(tabs)/mypage/family/apply')}>
            <Text style={styles.textLink}>가족 등록하러 가기</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <View style={styles.completeBlock}>
        <Ionicons name="paw" size={48} color={DodoColors.brand} />
        <Text style={styles.title}>회원가입 완료</Text>
        <Text style={styles.subtitle}>반려동물과의 행복한 하루,{'\n'}DoDo가 함께할게요!</Text>
      </View>
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
    backgroundColor: DodoColors.background,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stepContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  stepFooter: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: DodoColors.brand,
    letterSpacing: 0.5,
    marginTop: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: DodoColors.textPrimary,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 13,
    color: DodoColors.textSecondary,
    lineHeight: 19,
    marginTop: 10,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  errorMessage: {
    fontSize: 13,
    color: DodoColors.textSecondary,
    textAlign: 'center',
  },
  termsBlock: {
    marginTop: 32,
    gap: 8,
  },
  termsLinksRow: {
    flexDirection: 'row',
    gap: 12,
    paddingLeft: 30,
  },
  termsLink: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
    textDecorationLine: 'underline',
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  choiceDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: DodoColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceDotSelected: {
    backgroundColor: DodoColors.brand,
  },
  choiceLabel: {
    fontSize: 14,
    color: DodoColors.textPrimary,
  },
  avatarRow: {
    alignItems: 'center',
    marginTop: 20,
  },
  card: {
    marginTop: 24,
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.textSecondary,
    marginTop: 10,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.surface,
    paddingHorizontal: 12,
    fontSize: 13,
    color: DodoColors.textPrimary,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inlineInput: {
    flex: 1,
  },
  subButton: {
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DodoColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subButtonDisabled: {
    opacity: 0.5,
  },
  subButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  readonlyInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.background,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  readonlyValue: {
    fontSize: 13,
    color: DodoColors.textPrimary,
  },
  placeholderValue: {
    fontSize: 13,
    color: DodoColors.fenceIdleLabel,
  },
  feedback: {
    fontSize: 11,
    marginTop: 2,
  },
  feedbackSuccess: {
    color: DodoColors.brand,
  },
  feedbackError: {
    color: DodoColors.fenceOutside,
  },
  completeBlock: {
    alignItems: 'center',
    marginTop: 40,
    gap: 4,
  },
  primaryButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: DodoColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: DodoColors.brandForeground,
  },
  textLinkButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  textLink: {
    fontSize: 13,
    color: DodoColors.fenceIdleLabel,
    textDecorationLine: 'underline',
  },
});
