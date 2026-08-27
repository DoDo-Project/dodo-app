import { StyleSheet, Text, View } from 'react-native';

import { DodoColors } from '@/constants/theme';

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>알림함 화면 준비 중</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: DodoColors.background },
  text: { color: DodoColors.textSecondary, fontSize: 15 },
});
