/**
 * Add/Edit Schedule Screen
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
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, Schedule} from '../types';
import {useApp} from '../context/AppContext';
import {Button, Input, Card} from '../components/common';
import {Colors, Spacing, FontSize} from '../constants';
import {generateId, getCurrentTimestamp, formatDate} from '../utils';

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

  const scheduleId = route.params?.scheduleId;
  const existingSchedule = scheduleId
    ? state.schedules.find(s => s.id === scheduleId)
    : undefined;

  const [title, setTitle] = useState(existingSchedule?.title || '');
  const [date, setDate] = useState(
    existingSchedule?.date || new Date().toISOString(),
  );
  const [time, setTime] = useState(existingSchedule?.time || '');
  const [selectedShopId, setSelectedShopId] = useState(
    existingSchedule?.shopId || '',
  );
  const [selectedListId, setSelectedListId] = useState(
    existingSchedule?.listId || '',
  );
  const [recurring, setRecurring] = useState<string>(
    existingSchedule?.recurringPattern || 'none',
  );
  const [reminderMinutes, setReminderMinutes] = useState(
    existingSchedule?.reminderMinutes || 0,
  );
  const [notes, setNotes] = useState(existingSchedule?.notes || '');

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
      time: time || undefined,
      shopId: selectedShopId || undefined,
      listId: selectedListId || undefined,
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
    <View style={styles.container}>
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

        <Text style={styles.label}>Date</Text>
        <Card>
          <Text style={styles.dateText}>📅 {formatDate(date)}</Text>
          <Text style={styles.helperText}>
            Tap to change date (date picker coming soon)
          </Text>
        </Card>

        <Input
          label="Time (optional)"
          value={time}
          onChangeText={setTime}
          placeholder="e.g., 10:00 AM"
        />

        {state.shops.length > 0 && (
          <>
            <Text style={styles.label}>Assign to Shop (optional)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}>
              <TouchableOpacity
                style={[
                  styles.selectItem,
                  !selectedShopId && styles.selectItemSelected,
                ]}
                onPress={() => setSelectedShopId('')}>
                <Text style={styles.selectItemText}>None</Text>
              </TouchableOpacity>
              {state.shops.map(shop => (
                <TouchableOpacity
                  key={shop.id}
                  style={[
                    styles.selectItem,
                    selectedShopId === shop.id && styles.selectItemSelected,
                  ]}
                  onPress={() => setSelectedShopId(shop.id)}>
                  <Text style={styles.selectItemText}>{shop.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {state.shoppingLists.length > 0 && (
          <>
            <Text style={styles.label}>Link to Shopping List (optional)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}>
              <TouchableOpacity
                style={[
                  styles.selectItem,
                  !selectedListId && styles.selectItemSelected,
                ]}
                onPress={() => setSelectedListId('')}>
                <Text style={styles.selectItemText}>None</Text>
              </TouchableOpacity>
              {state.shoppingLists.map(list => (
                <TouchableOpacity
                  key={list.id}
                  style={[
                    styles.selectItem,
                    selectedListId === list.id && styles.selectItemSelected,
                  ]}
                  onPress={() => setSelectedListId(list.id)}>
                  <Text style={styles.selectItemText}>{list.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <Text style={styles.label}>Repeat</Text>
        <View style={styles.optionRow}>
          {recurringOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionItem,
                recurring === option.id && styles.optionItemSelected,
              ]}
              onPress={() => setRecurring(option.id)}>
              <Text
                style={[
                  styles.optionText,
                  recurring === option.id && styles.optionTextSelected,
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Reminder</Text>
        <View style={styles.optionColumn}>
          {reminderOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.reminderItem,
                reminderMinutes === option.id && styles.reminderItemSelected,
              ]}
              onPress={() => setReminderMinutes(option.id)}>
              <Text
                style={[
                  styles.reminderText,
                  reminderMinutes === option.id && styles.reminderTextSelected,
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

      <View style={styles.footer}>
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
    backgroundColor: Colors.background,
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
    color: Colors.error,
    fontSize: FontSize.base,
    fontWeight: '500',
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  dateText: {
    fontSize: FontSize.base,
    color: Colors.text,
  },
  helperText: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  horizontalScroll: {
    marginBottom: Spacing.md,
  },
  selectItem: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectItemSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectItemText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  optionItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionItemSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  optionTextSelected: {
    color: Colors.textInverse,
  },
  optionColumn: {
    marginBottom: Spacing.md,
  },
  reminderItem: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reminderItemSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  reminderText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  reminderTextSelected: {
    color: Colors.textInverse,
  },
  completeButton: {
    marginTop: Spacing.lg,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});

export default AddEditScheduleScreen;
