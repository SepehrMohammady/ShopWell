/**
 * Schedule Screen
 * Redesigned: product-focused shopping schedule cards
 */

import React from 'react';
import {View, FlatList, StyleSheet, Text, Image} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, Schedule, Product} from '../types';
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

  const getProducts = (productIds?: string[]): Product[] => {
    if (!productIds || productIds.length === 0) return [];
    return productIds
      .map(id => state.products.find(p => p.id === id))
      .filter((p): p is Product => !!p);
  };

  // Sort: incomplete first (by date asc), then completed (by date desc)
  const sortedSchedules = [...state.schedules].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const renderScheduleItem = ({item}: {item: Schedule}) => {
    const shopName = getShopName(item.shopId);
    const products = getProducts(item.productIds);
    const isPast = new Date(item.date).getTime() < Date.now() && !item.isRecurring;

    return (
      <Card onPress={() => handleSchedulePress(item.id)} elevated>
        <View style={[styles.scheduleCard, item.isCompleted && styles.completedCard]}>
          {/* Top row: date badge + title + status */}
          <View style={styles.headerRow}>
            <View style={[styles.dateBadge, {backgroundColor: item.isCompleted ? colors.success : isPast ? colors.error : colors.primary}]}>
              <Text style={[styles.dateDay, {color: colors.textInverse}]}>
                {new Date(item.date).getDate()}
              </Text>
              <Text style={[styles.dateMonth, {color: colors.textInverse}]}>
                {new Date(item.date).toLocaleDateString('en-US', {month: 'short'})}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, {color: colors.text}, item.isCompleted && styles.completedText]} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.isCompleted && (
                  <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
                )}
              </View>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="calendar-clock" size={14} color={colors.textSecondary} />
                <Text style={[styles.metaText, {color: colors.textSecondary}]}>
                  {getRelativeDate(item.date)}
                  {item.time ? ` • ${item.time}` : ''}
                </Text>
              </View>
              {shopName && (
                <View style={styles.metaRow}>
                  <MaterialCommunityIcons name="store" size={14} color={colors.textSecondary} />
                  <Text style={[styles.metaText, {color: colors.textSecondary}]}>{shopName}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Products list - the main content */}
          {products.length > 0 && (
            <View style={[styles.productsSection, {borderTopColor: colors.border}]}>
              <View style={styles.productsSectionHeader}>
                <MaterialCommunityIcons name="cart-outline" size={16} color={colors.primary} />
                <Text style={[styles.productsSectionTitle, {color: colors.primary}]}>
                  {products.length} item{products.length !== 1 ? 's' : ''} to buy
                </Text>
              </View>
              {products.map((product, index) => (
                <View key={product.id} style={styles.productRow}>
                  {product.imageUri ? (
                    <Image source={{uri: product.imageUri}} style={styles.productImage} />
                  ) : (
                    <View style={[styles.productBullet, {backgroundColor: colors.primary + '30'}]}>
                      <MaterialCommunityIcons name="circle-medium" size={14} color={colors.primary} />
                    </View>
                  )}
                  <Text
                    style={[styles.productName, {color: colors.text}]}
                    numberOfLines={1}>
                    {product.name}
                  </Text>
                  {!product.isAvailable && (
                    <View style={[styles.needBadge, {backgroundColor: colors.warning + '20'}]}>
                      <Text style={[styles.needBadgeText, {color: colors.warning}]}>Need</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Badges row */}
          {(item.isRecurring || item.reminder) && (
            <View style={[styles.badgesRow, {borderTopColor: colors.border}]}>
              {item.isRecurring && (
                <View style={[styles.badge, {backgroundColor: colors.primary + '15'}]}>
                  <MaterialCommunityIcons name="repeat" size={13} color={colors.primary} />
                  <Text style={[styles.badgeText, {color: colors.primary}]}>{item.recurringPattern}</Text>
                </View>
              )}
              {item.reminder && (
                <View style={[styles.badge, {backgroundColor: colors.warning + '15'}]}>
                  <MaterialCommunityIcons name="bell" size={13} color={colors.warning} />
                  <Text style={[styles.badgeText, {color: colors.warning}]}>
                    {item.reminderMinutes! >= 60
                      ? `${item.reminderMinutes! / 60}h before`
                      : `${item.reminderMinutes}m before`}
                  </Text>
                </View>
              )}
            </View>
          )}
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
  scheduleCard: {
    // wrapper for opacity on completed
  },
  completedCard: {
    opacity: 0.6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateBadge: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  dateMonth: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  headerInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: FontSize.sm,
  },
  productsSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  productsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  productsSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    gap: Spacing.sm,
  },
  productImage: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  productBullet: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: FontSize.sm,
    flex: 1,
  },
  needBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  needBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
});

export default ScheduleScreen;
