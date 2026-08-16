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

export default function CommunityStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: DodoColors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="[boardId]"
        options={{
          presentation: 'card',
          headerShown: true,
          title: '',
          headerStyle: { backgroundColor: DodoColors.surface },
          headerShadowVisible: false,
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: '게시글 작성',
          headerStyle: { backgroundColor: DodoColors.surface },
          headerShadowVisible: false,
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="my"
        options={{
          headerShown: true,
          title: '',
          headerStyle: { backgroundColor: DodoColors.surface },
          headerShadowVisible: false,
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack>
  );
}
