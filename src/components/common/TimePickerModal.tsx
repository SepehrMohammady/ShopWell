/**
 * Custom in-app Time Picker Modal
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
  FlatList,
} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {Spacing, FontSize} from '../../constants';

interface TimePickerModalProps {
  visible: boolean;
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
// Half the list is padded above and below so the first and last values can
// still reach the middle of the wheel.
const WHEEL_PADDING = ITEM_HEIGHT * 2;

const WheelColumn: React.FC<{
  data: {label: string; value: number}[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  colors: any;
  visible: boolean;
}> = ({data, selectedValue, onValueChange, colors, visible}) => {
  const flatListRef = useRef<FlatList>(null);
  const selectedIndex = data.findIndex(d => d.value === selectedValue);

  // Re-centre whenever the sheet opens too, not only when the value changes,
  // or reopening it would leave the wheel on its previous scroll position.
  useEffect(() => {
    if (visible && flatListRef.current && selectedIndex >= 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({index: selectedIndex, animated: false, viewPosition: 0.5});
      }, 50);
    }
  }, [selectedIndex, visible]);

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
        contentContainerStyle={{paddingVertical: WHEEL_PADDING}}
        // The offset has to include the leading padding, otherwise scrollToIndex
        // parks the selected value two rows below the middle of the wheel while
        // onMomentumScrollEnd still reads the middle - so a scroll would land on
        // a value two places from the one the user lined up.
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: WHEEL_PADDING + ITEM_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
};

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  value,
  onConfirm,
  onCancel,
}) => {
  const {colors} = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selectedHour, setSelectedHour] = useState(() => {
    const h = value.getHours();
    return h % 12 || 12;
  });
  const [selectedMinute, setSelectedMinute] = useState(value.getMinutes());
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(value.getHours() >= 12 ? 'PM' : 'AM');

  useEffect(() => {
    if (visible) {
      const h = value.getHours();
      setSelectedHour(h % 12 || 12);
      setSelectedMinute(value.getMinutes());
      setSelectedPeriod(h >= 12 ? 'PM' : 'AM');
      Animated.timing(fadeAnim, {toValue: 1, duration: 200, useNativeDriver: true}).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const hours = Array.from({length: 12}, (_, i) => ({label: `${i + 1}`, value: i + 1}));
  const minutes = Array.from({length: 60}, (_, i) => ({label: i.toString().padStart(2, '0'), value: i}));
  const periods = [{label: 'AM', value: 0}, {label: 'PM', value: 1}];

  const handleConfirm = () => {
    const result = new Date(value);
    let h24 = selectedHour;
    if (selectedPeriod === 'PM' && selectedHour < 12) h24 += 12;
    if (selectedPeriod === 'AM' && selectedHour === 12) h24 = 0;
    result.setHours(h24, selectedMinute, 0, 0);
    onConfirm(result);
  };

  const previewH = selectedHour;
  const previewM = selectedMinute.toString().padStart(2, '0');

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
        <TouchableOpacity style={styles.overlayTouch} activeOpacity={1} onPress={onCancel} />
        <Animated.View style={[styles.sheet, {backgroundColor: colors.surface}]}>
          <View style={styles.sheetHandle}>
            <View style={[styles.handleBar, {backgroundColor: colors.border}]} />
          </View>
          <Text style={[styles.sheetTitle, {color: colors.text}]}>Select Time</Text>
          <Text style={[styles.preview, {color: colors.primary}]}>
            {previewH}:{previewM} {selectedPeriod}
          </Text>
          <View style={styles.wheelsRow}>
            {/* Marks the row the wheels actually select. */}
            <View
              pointerEvents="none"
              style={[
                styles.selectionBand,
                {backgroundColor: colors.primary + '15', borderColor: colors.primary + '40'},
              ]}
            />
            <WheelColumn data={hours} selectedValue={selectedHour} onValueChange={setSelectedHour} colors={colors} visible={visible} />
            <Text style={[styles.separator, {color: colors.text}]}>:</Text>
            <WheelColumn data={minutes} selectedValue={selectedMinute} onValueChange={setSelectedMinute} colors={colors} visible={visible} />
            <WheelColumn
              data={periods}
              selectedValue={selectedPeriod === 'AM' ? 0 : 1}
              onValueChange={v => setSelectedPeriod(v === 0 ? 'AM' : 'PM')}
              colors={colors}
              visible={visible}
            />
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
    fontSize: FontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  wheelsRow: {
    flexDirection: 'row',
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    paddingHorizontal: Spacing.lg,
  },
  wheelColumn: {
    flex: 1,
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
  },
  selectionBand: {
    position: 'absolute',
    left: Spacing.sm,
    right: Spacing.sm,
    top: ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
    borderRadius: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  separator: {
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 4,
    // The row no longer centres its children, so the colon centres itself.
    alignSelf: 'center',
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

export default TimePickerModal;
