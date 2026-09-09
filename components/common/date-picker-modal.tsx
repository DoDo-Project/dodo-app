import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DodoColors } from '@/constants/theme';

type Props = {
  visible: boolean;
  /** 'YYYY-MM-DD' */
  initialDate?: string;
  /** 'YYYY-MM-DD' — 이 날짜 이후는 선택 불가 */
  maxDate?: string;
  /** 'YYYY-MM-DD' — 이 날짜 이전은 선택 불가 */
  minDate?: string;
  onClose: () => void;
  onConfirm: (date: string) => void;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toDateString(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function DatePickerModal({ visible, initialDate, maxDate, minDate, onClose, onConfirm }: Props) {
  const insets = useSafeAreaInsets();
  const today = new Date();
  const initial = parseDate(initialDate) ?? today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    if (!visible) return;
    const base = parseDate(initialDate) ?? today;
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialDate]);

  const max = parseDate(maxDate);
  const min = parseDate(minDate);
  const selected = parseDate(initialDate);

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // 항상 6행(42칸)으로 고정해서 달마다 일수가 달라져도 캘린더 높이가 흔들리지 않게 한다
  const leadingCells = Array.from({ length: startWeekday }, () => null);
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const trailingCount = Math.max(0, 42 - leadingCells.length - dayCells.length);
  const cells: (number | null)[] = [...leadingCells, ...dayCells, ...Array.from({ length: trailingCount }, () => null)];

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    if (max && d > max) return true;
    if (min && d < min) return true;
    return false;
  };

  const isSelected = (day: number) =>
    !!selected &&
    selected.getFullYear() === viewYear &&
    selected.getMonth() === viewMonth &&
    selected.getDate() === day;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTap} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={goPrevMonth}>
              <Ionicons name="chevron-back" size={20} color={DodoColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>
              {viewYear}년 {viewMonth + 1}월
            </Text>
            <TouchableOpacity style={styles.headerButton} onPress={goNextMonth}>
              <Ionicons name="chevron-forward" size={20} color={DodoColors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekdayText}>
                {w}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, index) => {
              if (day === null) return <View key={`empty-${index}`} style={styles.cell} />;
              const disabled = isDisabled(day);
              const active = isSelected(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={styles.cell}
                  disabled={disabled}
                  onPress={() => {
                    onConfirm(toDateString(viewYear, viewMonth, day));
                    onClose();
                  }}
                >
                  <View style={[styles.dayCircle, active && styles.dayCircleActive]}>
                    <Text style={[styles.dayText, disabled && styles.dayTextDisabled, active && styles.dayTextActive]}>
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.todayButton}
            onPress={() => {
              setViewYear(today.getFullYear());
              setViewMonth(today.getMonth());
            }}
          >
            <Text style={styles.todayButtonText}>오늘로 이동</Text>
          </TouchableOpacity>
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
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
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
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: DodoColors.fenceIdleLabel,
    paddingBottom: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: DodoColors.brand,
  },
  dayText: {
    fontSize: 13,
    color: DodoColors.textPrimary,
  },
  dayTextDisabled: {
    color: DodoColors.border,
  },
  dayTextActive: {
    color: DodoColors.brandForeground,
    fontWeight: '700',
  },
  todayButton: {
    alignSelf: 'center',
    paddingVertical: 10,
  },
  todayButtonText: {
    fontSize: 12,
    color: DodoColors.fenceIdleLabel,
    textDecorationLine: 'underline',
  },
});
