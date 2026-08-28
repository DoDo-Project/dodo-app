import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DodoColors } from '@/constants/theme';
import { socialLogin } from '@/shared/api/authApi';
import { useAuthStore } from '@/shared/lib/auth/authStore';
import { requestSocialAuthCode, type SocialProvider } from '@/shared/lib/auth/oauth';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((state) => state.setSession);
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);

  const providerLabel: Record<SocialProvider, string> = { GOOGLE: '구글', NAVER: '네이버' };

  const handleSocialLogin = async (provider: SocialProvider) => {
    if (loadingProvider) return;
    setLoadingProvider(provider);

    try {
      const codeResult = await requestSocialAuthCode(provider);
      if (!codeResult.success) {
        if (codeResult.reason !== 'cancelled') {
          Alert.alert('로그인 실패', `${providerLabel[provider]} 로그인 중 문제가 발생했어요. 다시 시도해주세요.`);
        }
        return;
      }

      const result = await socialLogin(provider, codeResult.code);

      if (result.kind === 'LOGIN') {
        await setSession(result.data);
        router.replace('/(tabs)/mypage');
        return;
      }

      router.push({
        pathname: '/auth/signup',
        params: {
          registrationToken: result.data.registrationToken,
          email: result.data.email,
          name: result.data.name,
          profileUrl: result.data.profileUrl ?? '',
        },
      });
    } catch {
      Alert.alert('로그인 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Ionicons name="paw" size={36} color={DodoColors.brandForeground} />
        </View>
        <Text style={styles.logoText}>DoDo</Text>
        <Text style={styles.title}>DoDo와 함께 시작해보세요</Text>
        <Text style={styles.subtitle}>구글 계정으로 간편하게 시작할 수 있어요.</Text>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.socialButton, styles.googleButton]}
          onPress={() => handleSocialLogin('GOOGLE')}
          disabled={loadingProvider !== null}
          activeOpacity={0.85}
        >
          {loadingProvider === 'GOOGLE' ? (
            <ActivityIndicator color={DodoColors.textSecondary} />
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color={DodoColors.textSecondary} />
              <Text style={styles.googleButtonText}>Google로 시작하기</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.socialButton, styles.naverButton]}
          onPress={() => handleSocialLogin('NAVER')}
          disabled={loadingProvider !== null}
          activeOpacity={0.85}
        >
          {loadingProvider === 'NAVER' ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.naverGlyph}>N</Text>
              <Text style={styles.naverButtonText}>네이버로 시작하기</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip} disabled={loadingProvider !== null}>
        <Text style={styles.skipButtonText}>로그인 없이 둘러보기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DodoColors.background,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    marginTop: 40,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: DodoColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: DodoColors.brand,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: DodoColors.textSecondary,
  },
  buttonGroup: {
    gap: 12,
  },
  socialButton: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  googleButton: {
    backgroundColor: DodoColors.surface,
    borderWidth: 1,
    borderColor: DodoColors.border,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  naverButton: {
    backgroundColor: '#03C75A',
  },
  naverButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  naverGlyph: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  comingSoonBadge: {
    position: 'absolute',
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  comingSoonBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 13,
    color: DodoColors.fenceIdleLabel,
    textDecorationLine: 'underline',
  },
});
