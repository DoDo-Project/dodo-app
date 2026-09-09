import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DodoColors } from '@/constants/theme';
import {
  formatRegionLabel,
  getSigunguList,
  hasSigunguOptions,
  parseRegionLabel,
  SIDO_LIST,
} from '@/shared/lib/regions';

type Props = {
  visible: boolean;
  initialRegion: string;
  onClose: () => void;
  onConfirm: (region: string) => void;
};

export function RegionSelectModal({ visible, initialRegion, onClose, onConfirm }: Props) {
  const insets = useSafeAreaInsets();
  const [sido, setSido] = useState('');

  useEffect(() => {
    if (visible) setSido(parseRegionLabel(initialRegion).sido);
  }, [visible, initialRegion]);

  const handleSelectSido = (value: string) => {
    if (hasSigunguOptions(value)) {
      setSido(value);
      return;
    }
    onConfirm(formatRegionLabel(value, null));
    onClose();
  };

  const handleSelectSigungu = (value: string) => {
    onConfirm(formatRegionLabel(sido, value));
    onClose();
  };

  const sigunguList = sido ? getSigunguList(sido) : [];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTap} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            {sido ? (
              <TouchableOpacity style={styles.headerButton} onPress={() => setSido('')}>
                <Ionicons name="chevron-back" size={20} color={DodoColors.textPrimary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerButton} />
            )}
            <Text style={styles.title}>{sido ? `${sido} · 시/군/구 선택` : '지역 선택'}</Text>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <Ionicons name="close" size={20} color={DodoColors.textPrimary} />
            </TouchableOpacity>
          </View>

          {!sido ? (
            <FlatList
              data={SIDO_LIST}
              keyExtractor={(item) => item}
              style={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.row} onPress={() => handleSelectSido(item)}>
                  <Text style={styles.rowText}>{item}</Text>
                  <Ionicons name="chevron-forward" size={16} color={DodoColors.fenceIdleLabel} />
                </TouchableOpacity>
              )}
            />
          ) : (
            <FlatList
              data={sigunguList}
              keyExtractor={(item) => item}
              style={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.row} onPress={() => handleSelectSigungu(item)}>
                  <Text style={styles.rowText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    backgroundColor: DodoColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: DodoColors.border,
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: DodoColors.background,
  },
  rowText: {
    fontSize: 14,
    color: DodoColors.textPrimary,
  },
});
