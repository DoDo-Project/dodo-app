import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { Link, useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { logout } from '@/shared/api/authApi';
import { getMe } from '@/shared/api/userApi';
import { DodoColors } from '@/constants/theme';
import { useAuthStore } from '@/shared/lib/auth/authStore';
import * as tokenStorage from '@/shared/lib/auth/tokenStorage';

type MenuItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href?: Parameters<typeof Link>[0]['href'];
  danger?: boolean;
};

const PET_MENU: MenuItem[] = [
  { key: 'pets', label: '반려동물 리스트', icon: 'paw-outline', href: '/(tabs)/mypage/pets' },
  { key: 'device', label: '디바이스 관리', icon: 'hardware-chip-outline', href: '/(tabs)/mypage/device' },
  { key: 'family', label: '가족 관리', icon: 'people-outline', href: '/(tabs)/mypage/family' },
  { key: 'walk-log', label: '산책 기록', icon: 'walk-outline', href: '/(tabs)/walk/history' },
  { key: 'ai-report', label: 'AI 레포트', icon: 'analytics-outline', href: '/(tabs)/mypage/ai-report' },
];

const ACCOUNT_MENU: MenuItem[] = [
  { key: 'profile-edit', label: '회원정보 수정', icon: 'person-circle-outline', href: '/(tabs)/mypage/profile-edit' },
  { key: 'notifications', label: '알림 설정', icon: 'notifications-outline', href: '/(tabs)/mypage/notifications' },
  { key: 'logout', label: '로그아웃', icon: 'log-out-outline', danger: true },
];

export default function MyPageScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearSession = useAuthStore((state) => state.clearSession);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const insets = useSafeAreaInsets();

  const meQuery = useQuery({
    queryKey: ['users', 'me'],
    queryFn: getMe,
    enabled: isAuthenticated,
  });

  // 웹과 동일: 서버 응답으로 로컬 프로필 캐시 동기화 (헤더 등 다른 화면과 공유)
  useEffect(() => {
    if (meQuery.data) {
      updateProfile({
        nickname: meQuery.data.nickname,
        region: meQuery.data.region,
        profileUrl: meQuery.data.profileUrl,
        notificationEnabled: meQuery.data.notificationEnabled,
      });
    }
  }, [meQuery.data, updateProfile]);

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          const refreshToken = await tokenStorage.getRefreshToken();
          if (refreshToken) {
            // 서버 로그아웃 실패해도 로컬 세션은 정리한다 (토큰이 이미 무효했을 수도 있음)
            await logout(refreshToken).catch(() => {});
          }
          await clearSession();
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  const renderRow = (item: MenuItem) => {
    const content = (
      <View style={styles.menuRow}>
        <View style={styles.menuRowLeft}>
          <Ionicons
            name={item.icon}
            size={18}
            color={item.danger ? DodoColors.fenceOutside : DodoColors.textSecondary}
          />
          <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>{item.label}</Text>
        </View>
        {!item.danger && <Ionicons name="chevron-forward" size={16} color={DodoColors.fenceIdleLabel} />}
      </View>
    );

    if (item.key === 'logout') {
      return (
        <TouchableOpacity key={item.key} onPress={handleLogout}>
          {content}
        </TouchableOpacity>
      );
    }

    return (
      <Link key={item.key} href={item.href!} asChild>
        <TouchableOpacity>{content}</TouchableOpacity>
      </Link>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={[styles.content, styles.guestContent, { paddingTop: insets.top + 16 }]}>
          <View style={styles.avatar}>
            <Ionicons name="paw" size={28} color={DodoColors.brandForeground} />
          </View>
          <Text style={styles.nickname}>로그인이 필요해요</Text>
          <Text style={styles.profileMeta}>로그인하면 반려동물 정보와 회원정보를 관리할 수 있어요.</Text>
          {/* generated route types omit the bare "/auth" index route (typegen quirk), but it's the only path that resolves at runtime */}
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/auth' as Href)}>
            <Text style={styles.loginButtonText}>로그인하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="paw" size={28} color={DodoColors.brandForeground} />
          </View>
          <Text style={styles.nickname}>{meQuery.data?.nickname ?? ' '}님</Text>
          <Text style={styles.profileMeta}>{meQuery.data?.region}</Text>
          <Text style={styles.profileMeta}>{meQuery.data?.email}</Text>
        </View>

        <Text style={styles.sectionLabel}>반려동물</Text>
        <View style={styles.menuCard}>{PET_MENU.map(renderRow)}</View>

        <Text style={styles.sectionLabel}>회원정보</Text>
        <View style={styles.menuCard}>{ACCOUNT_MENU.map(renderRow)}</View>
      </ScrollView>
    </View>
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
  },
  guestContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 32,
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
  profileCard: {
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: DodoColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  nickname: {
    fontSize: 17,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  profileMeta: {
    fontSize: 12,
    color: DodoColors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: DodoColors.fenceIdleLabel,
    marginBottom: 8,
    marginTop: 4,
  },
  menuCard: {
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: DodoColors.background,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuLabel: {
    fontSize: 14,
    color: DodoColors.textPrimary,
  },
  menuLabelDanger: {
    color: DodoColors.fenceOutside,
  },
});
