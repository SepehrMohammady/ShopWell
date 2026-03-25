/**
 * Add/Edit Schedule Screen
 * Redesigned: native time picker, product assignment
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker, {DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, Schedule} from '../types';
import {useApp} from '../context/AppContext';
import {useTheme} from '../context/ThemeContext';
import {Button, Input, Card} from '../components/common';
import {Spacing, FontSize} from '../constants';
import {generateId, getCurrentTimestamp, formatDate} from '../utils';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'AddEditSchedule'>;

const recurringOptions = [
  {id: 'none', label: 'No Repeat'},
  {id: 'daily', label: 'Daily'},
  {id: 'weekly', label: 'Weekly'},
  {id: 'monthly', label: 'Monthly'},
];

const reminderOptions = [
  {id: 0, label: 'No Reminder'},
  {id: 15, label: '15 minutes before'},
  {id: 30, label: '30 minutes before'},
  {id: 60, label: '1 hour before'},
  {id: 1440, label: '1 day before'},
];

const AddEditScheduleScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const {state, addSchedule, updateSchedule, deleteSchedule} = useApp();
  const {colors} = useTheme();

  const scheduleId = route.params?.scheduleId;
  const existingSchedule = scheduleId
    ? state.schedules.find(s => s.id === scheduleId)
    : undefined;

  const [title, setTitle] = useState(existingSchedule?.title || '');
  const [date, setDate] = useState(
    existingSchedule?.date || new Date().toISOString(),
  );
  const [timeEnabled, setTimeEnabled] = useState(!!existingSchedule?.time);
  const [timeDate, setTimeDate] = useState<Date>(() => {
    if (existingSchedule?.time) {
      const match = existingSchedule.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        const d = new Date();
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const period = match[3];
        if (period?.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (period?.toUpperCase() === 'AM' && hours === 12) hours = 0;
        d.setHours(hours, minutes, 0, 0);
        return d;
      }
    }
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [selectedShopId, setSelectedShopId] = useState(
    existingSchedule?.shopId || '',
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    existingSchedule?.productIds || [],
  );
  const [recurring, setRecurring] = useState<string>(
    existingSchedule?.recurringPattern || 'none',
  );
  const [reminderMinutes, setReminderMinutes] = useState(
    existingSchedule?.reminderMinutes || 0,
  );
  const [notes, setNotes] = useState(existingSchedule?.notes || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate.toISOString());
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setTimeDate(selectedTime);
    }
  };

  const formatTime = (d: Date): string => {
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId],
    );
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        existingSchedule ? (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.headerButton}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        ) : null,
    });
  }, [existingSchedule]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    const now = getCurrentTimestamp();
    const schedule: Schedule = {
      id: existingSchedule?.id || generateId(),
      title: title.trim(),
      date,
      time: timeEnabled ? formatTime(timeDate) : undefined,
      shopId: selectedShopId || undefined,
      productIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
      isRecurring: recurring !== 'none',
      recurringPattern:
        recurring !== 'none'
          ? (recurring as 'daily' | 'weekly' | 'monthly')
          : undefined,
      reminder: reminderMinutes > 0,
      reminderMinutes: reminderMinutes > 0 ? reminderMinutes : undefined,
      notes: notes.trim() || undefined,
      isCompleted: existingSchedule?.isCompleted || false,
      createdAt: existingSchedule?.createdAt || now,
      updatedAt: now,
    };

    if (existingSchedule) {
      updateSchedule(schedule);
    } else {
      addSchedule(schedule);
    }

    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this schedule?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteSchedule(scheduleId!);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleToggleComplete = () => {
    if (existingSchedule) {
      updateSchedule({
        ...existingSchedule,
        isCompleted: !existingSchedule.isCompleted,
        updatedAt: getCurrentTimestamp(),
      });
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Weekly grocery shopping"
        />

        <Text style={[styles.label, {color: colors.text}]}>Date</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <Card>
            <View style={styles.dateRow}>
              <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
              <Text style={[styles.dateText, {color: colors.text}]}>{formatDate(date)}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </View>
          </Card>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(date)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        <Text style={[styles.label, {color: colors.text}]}>Time</Text>
        <TouchableOpacity
          onPress={() => {
            if (!timeEnabled) {
              setTimeEnabled(true);
              setShowTimePicker(true);
            } else {
              setShowTimePicker(true);
            }
          }}>
          <Card>
            <View style={styles.dateRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
              <Text style={[styles.dateText, {color: timeEnabled ? colors.text : colors.textSecondary}]}>
                {timeEnabled ? formatTime(timeDate) : 'No time set — tap to add'}
              </Text>
              {timeEnabled && (
                <TouchableOpacity
                  onPress={() => {
                    setTimeEnabled(false);
                    setShowTimePicker(false);
                  }}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </Card>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={timeDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}

        {state.shops.length > 0 && (
          <>
            <Text style={[styles.label, {color: colors.text}]}>Assign to Shop (optional)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}>
              <TouchableOpacity
                style={[
                  styles.selectItem,
                  {backgroundColor: colors.surface, borderColor: colors.border},
                  !selectedShopId && {backgroundColor: colors.primary, borderColor: colors.primary},
                ]}
                onPress={() => setSelectedShopId('')}>
                <Text style={[styles.selectItemText, {color: !selectedShopId ? colors.textInverse : colors.text}]}>None</Text>
              </TouchableOpacity>
              {state.shops.map(shop => (
                <TouchableOpacity
                  key={shop.id}
                  style={[
                    styles.selectItem,
                    {backgroundColor: colors.surface, borderColor: colors.border},
                    selectedShopId === shop.id && {backgroundColor: colors.primary, borderColor: colors.primary},
                  ]}
                  onPress={() => setSelectedShopId(shop.id)}>
                  <Text style={[styles.selectItemText, {color: selectedShopId === shop.id ? colors.textInverse : colors.text}]}>{shop.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {state.products.length > 0 && (
          <>
            <Text style={[styles.label, {color: colors.text}]}>
              Products ({selectedProductIds.length > 0 ? `${selectedProductIds.length} selected` : 'optional'})
            </Text>
            <View style={styles.productGrid}>
              {state.products
                .filter(p => !p.isAvailable) // Show shopping list items first
                .concat(state.products.filter(p => p.isAvailable))
                .map(product => {
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={[
                        styles.productChip,
                        {backgroundColor: colors.surface, borderColor: colors.border},
                        isSelected && {backgroundColor: colors.primary, borderColor: colors.primary},
                      ]}
                      onPress={() => toggleProduct(product.id)}>
                      {isSelected && (
                        <MaterialCommunityIcons name="check" size={14} color={colors.textInverse} />
                      )}
                      <Text
                        style={[
                          styles.productChipText,
                          {color: isSelected ? colors.textInverse : colors.text},
                        ]}
                        numberOfLines={1}>
                        {product.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
          </>
        )}

        <Text style={[styles.label, {color: colors.text}]}>Repeat</Text>
        <View style={styles.optionRow}>
          {recurringOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionItem,
                {backgroundColor: colors.surface, borderColor: colors.border},
                recurring === option.id && {backgroundColor: colors.primary, borderColor: colors.primary},
              ]}
              onPress={() => setRecurring(option.id)}>
              <Text
                style={[
                  styles.optionText,
                  {color: colors.text},
                  recurring === option.id && {color: colors.textInverse},
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, {color: colors.text}]}>Reminder</Text>
        <View style={styles.optionColumn}>
          {reminderOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.reminderItem,
                {backgroundColor: colors.surface, borderColor: colors.border},
                reminderMinutes === option.id && {backgroundColor: colors.primary, borderColor: colors.primary},
              ]}
              onPress={() => setReminderMinutes(option.id)}>
              <Text
                style={[
                  styles.reminderText,
                  {color: colors.text},
                  reminderMinutes === option.id && {color: colors.textInverse},
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any notes..."
          multiline
          numberOfLines={3}
        />

        {existingSchedule && (
          <Button
            title={
              existingSchedule.isCompleted
                ? 'Mark as Incomplete'
                : 'Mark as Complete'
            }
            onPress={handleToggleComplete}
            variant="outline"
            fullWidth
            style={styles.completeButton}
          />
        )}
      </ScrollView>

      <View style={[styles.footer, {backgroundColor: colors.surface, borderTopColor: colors.border}]}>
        <Button
          title={existingSchedule ? 'Save Changes' : 'Create Schedule'}
          onPress={handleSave}
          fullWidth
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.base,
    paddingBottom: 120,
  },
  headerButton: {
    paddingHorizontal: Spacing.base,
  },
  deleteText: {
    fontSize: FontSize.base,
    fontWeight: '500',
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateText: {
    fontSize: FontSize.base,
    flex: 1,
  },
  horizontalScroll: {
    marginBottom: Spacing.md,
  },
  selectItem: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginRight: Spacing.sm,
    borderWidth: 1,
  },
  selectItemText: {
    fontSize: FontSize.sm,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  optionItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  optionText: {
    fontSize: FontSize.sm,
  },
  optionColumn: {
    marginBottom: Spacing.md,
  },
  reminderItem: {
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  reminderText: {
    fontSize: FontSize.sm,
  },
  completeButton: {
    marginTop: Spacing.lg,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  productChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    maxWidth: '48%',
  },
  productChipText: {
    fontSize: FontSize.sm,
    flexShrink: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    borderTopWidth: 1,
  },
});

export default AddEditScheduleScreen;
