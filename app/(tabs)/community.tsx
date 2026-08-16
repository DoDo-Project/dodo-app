import { StyleSheet, Text, View } from 'react-native';

import { DodoColors } from '@/constants/theme';

export default function CommunityScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>커뮤니티 화면 준비 중</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DodoColors.background,
  },
  text: {
    color: DodoColors.textSecondary,
    fontSize: 15,
  },
});
