import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DodoColors } from '@/constants/theme';

export type WalkTab = 'fence' | 'activity';

type Props = {
  value: WalkTab;
  onChange: (tab: WalkTab) => void;
};

export function WalkTabSwitcher({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={[styles.item, value === 'fence' && styles.itemActive]} onPress={() => onChange('fence')}>
        <Text style={[styles.text, value === 'fence' && styles.textActive]}>울타리</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.item, value === 'activity' && styles.itemActive]}
        onPress={() => onChange('activity')}
      >
        <Text style={[styles.text, value === 'activity' && styles.textActive]}>산책 활동</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: DodoColors.background,
    borderRadius: 999,
    padding: 3,
    marginBottom: 16,
  },
  item: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: 'center',
  },
  itemActive: {
    backgroundColor: DodoColors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: DodoColors.fenceIdleLabel,
  },
  textActive: {
    color: DodoColors.textPrimary,
  },
});
