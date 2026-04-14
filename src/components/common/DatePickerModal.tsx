/**
 * Custom in-app Date Picker Modal
 * Replaces Android native DateTimePicker with app-themed UI
 */

import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {Spacing, FontSize} from '../../constants';

interface DatePickerModalProps {
  visible: boolean;
  value: Date;
  minimumDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WheelColumn: React.FC<{
  data: {label: string; value: number}[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  colors: any;
}> = ({data, selectedValue, onValueChange, colors}) => {
  const flatListRef = useRef<FlatList>(null);
  const selectedIndex = data.findIndex(d => d.value === selectedValue);

  useEffect(() => {
    if (flatListRef.current && selectedIndex >= 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({index: selectedIndex, animated: false, viewPosition: 0.5});
      }, 50);
    }
  }, [selectedIndex]);

  const handleMomentumScrollEnd = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, data.length - 1));
    if (data[clamped]) {
      onValueChange(data[clamped].value);
    }
  };

  return (
    <View style={styles.wheelColumn}>
      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(item, i) => `${item.value}-${i}`}
        renderItem={({item}) => {
          const isSelected = item.value === selectedValue;
          return (
            <TouchableOpacity
              style={[styles.wheelItem, isSelected && {backgroundColor: colors.primary + '15'}]}
              onPress={() => onValueChange(item.value)}>
              <Text style={[
                styles.wheelItemText,
                {color: isSelected ? colors.primary : colors.textSecondary},
                isSelected && styles.wheelItemTextSelected,
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={{paddingVertical: ITEM_HEIGHT * 2}}
        getItemLayout={(_, index) => ({length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index})}
      />
    </View>
  );
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
  const [selectedYear, setSelectedYear] = useState(value.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(value.getMonth());
  const [selectedDay, setSelectedDay] = useState(value.getDate());

  useEffect(() => {
    if (visible) {
      setSelectedYear(value.getFullYear());
      setSelectedMonth(value.getMonth());
      setSelectedDay(value.getDate());
      Animated.timing(fadeAnim, {toValue: 1, duration: 200, useNativeDriver: true}).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

  // Clamp day
  const clampedDay = Math.min(selectedDay, daysInMonth);

  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 5}, (_, i) => ({label: `${currentYear + i}`, value: currentYear + i}));
  const monthData = months.map((m, i) => ({label: m, value: i}));
  const dayData = Array.from({length: daysInMonth}, (_, i) => ({label: `${i + 1}`, value: i + 1}));

  const handleConfirm = () => {
    const result = new Date(selectedYear, selectedMonth, clampedDay);
    if (minimumDate && result < minimumDate) {
      onConfirm(minimumDate);
    } else {
      onConfirm(result);
    }
  };

  const previewDate = new Date(selectedYear, selectedMonth, clampedDay);
  const dayName = previewDate.toLocaleDateString('en-US', {weekday: 'long'});

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
        <TouchableOpacity style={styles.overlayTouch} activeOpacity={1} onPress={onCancel} />
        <Animated.View style={[styles.sheet, {backgroundColor: colors.surface}]}>
          <View style={styles.sheetHandle}>
            <View style={[styles.handleBar, {backgroundColor: colors.border}]} />
          </View>
          <Text style={[styles.sheetTitle, {color: colors.text}]}>Select Date</Text>
          <Text style={[styles.preview, {color: colors.primary}]}>
            {dayName}, {months[selectedMonth]} {clampedDay}, {selectedYear}
          </Text>
          <View style={styles.wheelsRow}>
            <WheelColumn data={monthData} selectedValue={selectedMonth} onValueChange={setSelectedMonth} colors={colors} />
            <WheelColumn data={dayData} selectedValue={clampedDay} onValueChange={setSelectedDay} colors={colors} />
            <WheelColumn data={years} selectedValue={selectedYear} onValueChange={setSelectedYear} colors={colors} />
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, {backgroundColor: colors.background}]} onPress={onCancel}>
              <Text style={[styles.buttonText, {color: colors.textSecondary}]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, {backgroundColor: colors.primary}]} onPress={handleConfirm}>
              <Text style={[styles.buttonText, {color: colors.textInverse}]}>Confirm</Text>
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
  wheelsRow: {
    flexDirection: 'row',
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    paddingHorizontal: Spacing.base,
  },
  wheelColumn: {
    flex: 1,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  wheelItemText: {
    fontSize: FontSize.base,
  },
  wheelItemTextSelected: {
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginTop: Spacing.base,
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
