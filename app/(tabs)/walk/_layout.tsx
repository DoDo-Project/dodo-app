import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

import { DodoColors } from '@/constants/theme';

function BackButton() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
      <Ionicons name="chevron-back" size={24} color={DodoColors.textPrimary} />
    </TouchableOpacity>
  );
}

const subScreenOptions = {
  headerShown: true,
  title: '',
  headerStyle: { backgroundColor: DodoColors.surface },
  headerShadowVisible: false,
  headerLeft: () => <BackButton />,
} as const;

export default function WalkStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: DodoColors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="history" options={{ ...subScreenOptions, title: '내 활동 기록' }} />
      <Stack.Screen name="history/[historyId]" options={{ ...subScreenOptions, title: '활동 상세' }} />
      <Stack.Screen name="popular" options={{ ...subScreenOptions, title: '주변 인기 활동' }} />
    </Stack>
  );
}
