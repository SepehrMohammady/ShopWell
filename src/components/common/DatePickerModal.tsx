/**
 * Custom in-app Date Picker Modal
 * A month calendar grid: weekday columns make the day of the week unambiguous,
 * and tapping a date cannot land on a different one the way a scroll wheel can.
 */

import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '../../context/ThemeContext';
import {Spacing, FontSize} from '../../constants';

interface DatePickerModalProps {
  visible: boolean;
  value: Date;
  minimumDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// Week starts on Monday.
const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Midnight of the given date, so comparisons ignore the time of day. */
const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * The month laid out as whole weeks, with null for the padding cells before the
 * 1st and after the last day.
 */
const buildMonthGrid = (year: number, month: number): (number | null)[] => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay() is 0=Sunday; shift so 0=Monday.
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < leading; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
};

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  value,
  minimumDate,
  onConfirm,
  onCancel,
}) => {
  const {colors} = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [selected, setSelected] = useState<Date>(() => startOfDay(value));
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());

  useEffect(() => {
    if (visible) {
      const initial = startOfDay(value);
      setSelected(initial);
      setViewYear(initial.getFullYear());
      setViewMonth(initial.getMonth());
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const today = startOfDay(new Date());
  const minDay = minimumDate ? startOfDay(minimumDate) : undefined;
  const cells = buildMonthGrid(viewYear, viewMonth);

  const goToMonth = (delta: number) => {
    const shifted = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(shifted.getFullYear());
    setViewMonth(shifted.getMonth());
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    if (!minDay || today.getTime() >= minDay.getTime()) {
      setSelected(today);
    }
  };

  const dayName = selected.toLocaleDateString('en-US', {weekday: 'long'});

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent>
      <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onCancel}
        />
        <Animated.View
          style={[styles.sheet, {backgroundColor: colors.surface}]}>
          <View style={styles.sheetHandle}>
            <View
              style={[styles.handleBar, {backgroundColor: colors.border}]}
            />
          </View>

          <Text style={[styles.sheetTitle, {color: colors.text}]}>
            Select Date
          </Text>
          <Text style={[styles.preview, {color: colors.primary}]}>
            {dayName}, {months[selected.getMonth()]} {selected.getDate()},{' '}
            {selected.getFullYear()}
          </Text>

          {/* Month navigation */}
          <View style={styles.monthRow}>
            <TouchableOpacity
              style={[styles.monthNav, {backgroundColor: colors.background}]}
              onPress={() => goToMonth(-1)}
              accessibilityLabel="Previous month">
              <MaterialCommunityIcons
                name="chevron-left"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={[styles.monthLabel, {color: colors.text}]}>
              {months[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity
              style={[styles.monthNav, {backgroundColor: colors.background}]}
              onPress={() => goToMonth(1)}
              accessibilityLabel="Next month">
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekRow}>
            {weekdayLabels.map(label => (
              <View key={label} style={styles.cell}>
                <Text
                  style={[styles.weekdayText, {color: colors.textSecondary}]}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.grid}>
            {cells.map((day, index) => {
              if (day === null) {
                return <View key={`pad-${index}`} style={styles.cell} />;
              }

              const cellDate = new Date(viewYear, viewMonth, day);
              const isSelected = isSameDay(cellDate, selected);
              const isToday = isSameDay(cellDate, today);
              const isDisabled =
                !!minDay && cellDate.getTime() < minDay.getTime();

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={styles.cell}
                  disabled={isDisabled}
                  onPress={() => setSelected(cellDate)}>
                  <View
                    style={[
                      styles.dayCircle,
                      isToday &&
                        !isSelected && {
                          borderColor: colors.primary,
                          borderWidth: 1,
                        },
                      isSelected && {backgroundColor: colors.primary},
                    ]}>
                    <Text
                      style={[
                        styles.dayText,
                        {color: colors.text},
                        isDisabled && {
                          color: colors.textSecondary,
                          opacity: 0.35,
                        },
                        isSelected && {
                          color: colors.textInverse,
                          fontWeight: '700',
                        },
                      ]}>
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
            <Text style={[styles.todayText, {color: colors.primary}]}>
              Today
            </Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, {backgroundColor: colors.background}]}
              onPress={onCancel}>
              <Text style={[styles.buttonText, {color: colors.textSecondary}]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, {backgroundColor: colors.primary}]}
              onPress={() => onConfirm(selected)}>
              <Text style={[styles.buttonText, {color: colors.textInverse}]}>
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouch: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Spacing.xl,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  preview: {
    fontSize: FontSize.base,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  monthNav: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  weekdayText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: FontSize.base,
  },
  todayButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.xs,
  },
  todayText: {
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
  },
});

export default DatePickerModal;
