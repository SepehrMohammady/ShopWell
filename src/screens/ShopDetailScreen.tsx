/**
 * Shop Detail Screen
 */

import React from 'react';
import {View, StyleSheet, ScrollView, Text, TouchableOpacity} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import {useApp} from '../context/AppContext';
import {Card, EmptyState} from '../components/common';
import {Colors, Spacing, FontSize, CategoryColors} from '../constants';
import {formatDate, getCurrentTimestamp} from '../utils';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'ShopDetail'>;

const categoryEmojis: {[key: string]: string} = {
  grocery: '🛒',
  pharmacy: '💊',
  electronics: '📱',
  clothing: '👕',
  homeGoods: '🏠',
  other: '🏪',
};

const ShopDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const {state, updateShop} = useApp();

  const shopId = route.params.shopId;
  const shop = state.shops.find(s => s.id === shopId);

  // Find related schedules
  const relatedSchedules = state.schedules.filter(s => s.shopId === shopId);

  React.useEffect(() => {
    if (shop) {
      navigation.setOptions({
        title: shop.name,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('AddEditShop', {shopId})}
            style={styles.headerButton}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [shop]);

  if (!shop) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="❌"
          title="Shop Not Found"
          message="This shop no longer exists."
        />
      </View>
    );
  }

  const handleToggleFavorite = () => {
    updateShop({
      ...shop,
      isFavorite: !shop.isFavorite,
      updatedAt: getCurrentTimestamp(),
    });
  };

  const categoryColor = CategoryColors[shop.category] || Colors.other;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}>
        {/* Shop Header */}
        <Card elevated>
          <View style={styles.shopHeader}>
            <View
              style={[styles.categoryBadge, {backgroundColor: categoryColor}]}>
              <Text style={styles.categoryEmoji}>
                {categoryEmojis[shop.category] || '🏪'}
              </Text>
            </View>
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>{shop.name}</Text>
              <Text style={styles.categoryLabel}>
                {shop.category.charAt(0).toUpperCase() + shop.category.slice(1)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleToggleFavorite}
              style={styles.favoriteButton}>
              <Text style={styles.favoriteIcon}>
                {shop.isFavorite ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Address */}
        {shop.address && (
          <Card>
            <Text style={styles.detailLabel}>📍 Address</Text>
            <Text style={styles.detailValue}>{shop.address}</Text>
          </Card>
        )}

        {/* Notes */}
        {shop.notes && (
          <Card>
            <Text style={styles.detailLabel}>📝 Notes</Text>
            <Text style={styles.detailValue}>{shop.notes}</Text>
          </Card>
        )}

        {/* Created Date */}
        <Card>
          <Text style={styles.detailLabel}>📅 Added</Text>
          <Text style={styles.detailValue}>{formatDate(shop.createdAt)}</Text>
        </Card>

        {/* Related Schedules */}
        {relatedSchedules.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Upcoming Schedules ({relatedSchedules.length})
            </Text>
            {relatedSchedules.map(schedule => (
              <Card
                key={schedule.id}
                onPress={() =>
                  navigation.navigate('AddEditSchedule', {
                    scheduleId: schedule.id,
                  })
                }>
                <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                <Text style={styles.scheduleDate}>
                  📅 {formatDate(schedule.date)}
                </Text>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
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
  },
  headerButton: {
    paddingHorizontal: Spacing.base,
  },
  editText: {
    color: Colors.primary,
    fontSize: FontSize.base,
    fontWeight: '500',
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 28,
  },
  shopInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  shopName: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.text,
  },
  categoryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  favoriteButton: {
    padding: Spacing.sm,
  },
  favoriteIcon: {
    fontSize: 28,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  detailValue: {
    fontSize: FontSize.base,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  scheduleTitle: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
  },
  scheduleDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});

export default ShopDetailScreen;
