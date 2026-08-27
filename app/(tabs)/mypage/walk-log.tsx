import { StyleSheet, Text, View } from 'react-native';

import { DodoColors } from '@/constants/theme';

export default function WalkLogScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>산책 기록 화면 준비 중</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: DodoColors.background },
  text: { color: DodoColors.textSecondary, fontSize: 15 },
});
