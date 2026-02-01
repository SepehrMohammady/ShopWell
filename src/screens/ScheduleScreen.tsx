/**
 * Schedule Screen
 */

import React from 'react';
import {View, FlatList, StyleSheet, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, Schedule} from '../types';
import {useApp} from '../context/AppContext';
import {useTheme} from '../context/ThemeContext';
import {Card, EmptyState, FAB} from '../components/common';
import {Spacing, FontSize} from '../constants';
import {getRelativeDate} from '../utils';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const ScheduleScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {state} = useApp();
  const {colors} = useTheme();

  const handleAddSchedule = () => {
    navigation.navigate('AddEditSchedule', {});
  };

  const handleSchedulePress = (scheduleId: string) => {
    navigation.navigate('AddEditSchedule', {scheduleId});
  };

  const getShopName = (shopId?: string): string | undefined => {
    if (!shopId) return undefined;
    const shop = state.shops.find(s => s.id === shopId);
    return shop?.name;
  };

  const getListName = (listId?: string): string | undefined => {
    if (!listId) return undefined;
    const list = state.shoppingLists.find(l => l.id === listId);
    return list?.name;
  };

  // Sort schedules by date
  const sortedSchedules = [...state.schedules].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const renderScheduleItem = ({item}: {item: Schedule}) => {
    const shopName = getShopName(item.shopId);
    const listName = getListName(item.listId);

    return (
      <Card onPress={() => handleSchedulePress(item.id)} elevated>
        <View style={styles.scheduleHeader}>
          <View style={[styles.dateContainer, {backgroundColor: colors.primary}]}>
            <Text style={[styles.dateDay, {color: colors.textInverse}]}>
              {new Date(item.date).getDate()}
            </Text>
            <Text style={[styles.dateMonth, {color: colors.textInverse}]}>
              {new Date(item.date).toLocaleDateString('en-US', {month: 'short'})}
            </Text>
          </View>
          <View style={styles.scheduleDetails}>
            <View style={styles.titleRow}>
              <Text style={[styles.scheduleTitle, {color: colors.text}]}>{item.title}</Text>
              {item.isCompleted && <Text style={[styles.completedBadge, {color: colors.success}]}>✓</Text>}
            </View>
            <Text style={[styles.scheduleTime, {color: colors.textSecondary}]}>
              📅 {getRelativeDate(item.date)}
              {item.time && ` • ⏰ ${item.time}`}
            </Text>
            {shopName && (
              <Text style={[styles.scheduleMeta, {color: colors.textSecondary}]}>🏪 {shopName}</Text>
            )}
            {listName && (
              <Text style={[styles.scheduleMeta, {color: colors.textSecondary}]}>📝 {listName}</Text>
            )}
            {item.isRecurring && (
              <Text style={[styles.recurringBadge, {color: colors.primary}]}>
                🔄 {item.recurringPattern}
              </Text>
            )}
            {item.reminder && (
              <Text style={[styles.reminderBadge, {color: colors.warning}]}>
                🔔 Reminder {item.reminderMinutes} min before
              </Text>
            )}
          </View>
        </View>
      </Card>
    );
  };

  if (state.schedules.length === 0) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <EmptyState
          icon="📅"
          title="No Schedules"
          message="Plan your shopping trips by scheduling when to visit your favorite shops."
          actionLabel="Create Schedule"
          onAction={handleAddSchedule}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <FlatList
        data={sortedSchedules}
        renderItem={renderScheduleItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      <FAB onPress={handleAddSchedule} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: Spacing.base,
    paddingBottom: 100,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
  },
  dateMonth: {
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
  },
  scheduleDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    flex: 1,
  },
  completedBadge: {
    fontSize: FontSize.lg,
  },
  scheduleTime: {
    fontSize: FontSize.sm,
    marginTop: 4,
  },
  scheduleMeta: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  recurringBadge: {
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  reminderBadge: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
});

export default ScheduleScreen;
