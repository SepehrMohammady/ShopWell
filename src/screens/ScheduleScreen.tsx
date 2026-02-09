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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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

  // Sort schedules by date
  const sortedSchedules = [...state.schedules].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const renderScheduleItem = ({item}: {item: Schedule}) => {
    const shopName = getShopName(item.shopId);

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
              {item.isCompleted && (
                <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
              )}
            </View>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
              <Text style={[styles.scheduleTime, {color: colors.textSecondary}]}>
                {getRelativeDate(item.date)}
                {item.time && ` • `}
              </Text>
              {item.time && (
                <>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.scheduleTime, {color: colors.textSecondary}]}>
                    {item.time}
                  </Text>
                </>
              )}
            </View>
            {shopName && (
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="store" size={14} color={colors.textSecondary} />
                <Text style={[styles.scheduleMeta, {color: colors.textSecondary}]}>{shopName}</Text>
              </View>
            )}
            {item.isRecurring && (
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="repeat" size={14} color={colors.primary} />
                <Text style={[styles.recurringBadge, {color: colors.primary}]}>
                  {item.recurringPattern}
                </Text>
              </View>
            )}
            {item.reminder && (
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="bell" size={14} color={colors.warning} />
                <Text style={[styles.reminderBadge, {color: colors.warning}]}>
                  Reminder {item.reminderMinutes} min before
                </Text>
              </View>
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
          icon="calendar-blank"
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  scheduleTime: {
    fontSize: FontSize.sm,
  },
  scheduleMeta: {
    fontSize: FontSize.sm,
  },
  recurringBadge: {
    fontSize: FontSize.xs,
  },
  reminderBadge: {
    fontSize: FontSize.xs,
  },
});

export default ScheduleScreen;
