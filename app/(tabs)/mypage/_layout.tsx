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

export default function MyPageStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: DodoColors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="pets/index" options={subScreenOptions} />
      <Stack.Screen name="pets/new" options={{ ...subScreenOptions, presentation: 'modal', title: '반려동물 등록' }} />
      <Stack.Screen name="pets/[petId]/index" options={subScreenOptions} />
      <Stack.Screen name="pets/[petId]/weight" options={subScreenOptions} />
      <Stack.Screen name="pets/[petId]/notes" options={subScreenOptions} />
      <Stack.Screen name="device" options={subScreenOptions} />
      <Stack.Screen name="family/index" options={subScreenOptions} />
      <Stack.Screen name="family/apply" options={subScreenOptions} />
      <Stack.Screen name="family/received" options={subScreenOptions} />
      <Stack.Screen name="walk-log" options={subScreenOptions} />
      <Stack.Screen name="ai-report" options={subScreenOptions} />
      <Stack.Screen name="profile-edit" options={subScreenOptions} />
      <Stack.Screen name="notifications" options={subScreenOptions} />
    </Stack>
  );
}
