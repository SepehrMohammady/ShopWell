/**
 * Shop Detail Screen
 */

import React from 'react';
import {View, StyleSheet, ScrollView, Text, TouchableOpacity} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import {useApp} from '../context/AppContext';
import {useTheme} from '../context/ThemeContext';
import {Card, EmptyState, Button} from '../components/common';
import {Spacing, FontSize, CategoryColors} from '../constants';
import {formatDate, getCurrentTimestamp} from '../utils';
import {formatPrice, getCheaperAlternatives} from '../utils/priceHelper';

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
  const {state, updateShop, getProductsForShop} = useApp();
  const {colors} = useTheme();

  const shopId = route.params.shopId;
  const shop = state.shops.find(s => s.id === shopId);

  // Find related schedules and products
  const relatedSchedules = state.schedules.filter(s => s.shopId === shopId);
  const productsAtShop = getProductsForShop(shopId);
  const cheaperAlternatives = getCheaperAlternatives(
    shopId,
    state.shopProducts,
    state.shops,
    state.products,
  );

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
      <View style={[styles.container, {backgroundColor: colors.background}]}>
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

  const categoryColor = CategoryColors[shop.category] || colors.other;

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
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
              <Text style={[styles.shopName, {color: colors.text}]}>{shop.name}</Text>
              <Text style={[styles.categoryLabel, {color: colors.textSecondary}]}>
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
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>📍 Address</Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>{shop.address}</Text>
          </Card>
        )}

        {/* Notes */}
        {shop.notes && (
          <Card>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>📝 Notes</Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>{shop.notes}</Text>
          </Card>
        )}

        {/* Created Date */}
        <Card>
          <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>📅 Added</Text>
          <Text style={[styles.detailValue, {color: colors.text}]}>{formatDate(shop.createdAt)}</Text>
        </Card>

        {/* Shop Here Button */}
        {productsAtShop.length > 0 && (
          <TouchableOpacity
            style={[styles.shopHereButton, {backgroundColor: colors.primary}]}
            onPress={() => navigation.navigate('ShopMode', {shopId})}>
            <Text style={styles.shopHereEmoji}>🛒</Text>
            <View style={styles.shopHereContent}>
              <Text style={styles.shopHereTitle}>Shop Here</Text>
              <Text style={styles.shopHereSubtitle}>
                {productsAtShop.length} product{productsAtShop.length !== 1 ? 's' : ''} available
                {cheaperAlternatives.length > 0 && ` • ${cheaperAlternatives.length} with warnings`}
              </Text>
            </View>
            <Text style={styles.shopHereArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Products at this shop */}
        {productsAtShop.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>
              Products ({productsAtShop.length})
            </Text>
            {productsAtShop.slice(0, 5).map(({product, shopProduct}) => (
              <Card
                key={product.id}
                onPress={() => navigation.navigate('ProductDetail', {productId: product.id})}>
                <View style={styles.productRow}>
                  <Text style={[styles.productName, {color: colors.text}]}>
                    {product.name}
                  </Text>
                  <Text style={[styles.productPrice, {color: colors.primary}]}>
                    {formatPrice(shopProduct.price, state.settings.currency)}
                  </Text>
                </View>
              </Card>
            ))}
            {productsAtShop.length > 5 && (
              <TouchableOpacity
                style={[styles.seeAllButton, {borderColor: colors.border}]}
                onPress={() => navigation.navigate('ShopMode', {shopId})}>
                <Text style={[styles.seeAllText, {color: colors.primary}]}>
                  See all {productsAtShop.length} products →
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Related Schedules */}
        {relatedSchedules.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>
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
                <Text style={[styles.scheduleTitle, {color: colors.text}]}>{schedule.title}</Text>
                <Text style={[styles.scheduleDate, {color: colors.textSecondary}]}>
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
  },
  categoryLabel: {
    fontSize: FontSize.sm,
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
    marginBottom: Spacing.xs,
  },
  detailValue: {
    fontSize: FontSize.base,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  scheduleTitle: {
    fontSize: FontSize.base,
    fontWeight: '500',
  },
  scheduleDate: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  shopHereButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: 16,
    marginTop: Spacing.base,
  },
  shopHereEmoji: {
    fontSize: 32,
    marginRight: Spacing.base,
  },
  shopHereContent: {
    flex: 1,
  },
  shopHereTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shopHereSubtitle: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  shopHereArrow: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: FontSize.base,
    flex: 1,
  },
  productPrice: {
    fontSize: FontSize.base,
    fontWeight: '700',
    marginLeft: Spacing.base,
  },
  seeAllButton: {
    padding: Spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  seeAllText: {
    fontSize: FontSize.base,
    fontWeight: '600',
  },
});

export default ShopDetailScreen;
