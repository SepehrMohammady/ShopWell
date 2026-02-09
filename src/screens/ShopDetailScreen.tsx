/**
 * Shop Detail Screen
 */

import React from 'react';
import {View, StyleSheet, ScrollView, Text, TouchableOpacity} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {RootStackParamList, ShopCategoryInfo} from '../types';
import {useApp} from '../context/AppContext';
import {useTheme} from '../context/ThemeContext';
import {Card, EmptyState, Button} from '../components/common';
import {Spacing, FontSize, CategoryColors} from '../constants';
import {formatDate, getCurrentTimestamp} from '../utils';
import {formatPrice, getCheaperAlternatives} from '../utils/priceHelper';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'ShopDetail'>;

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
    state.shopProductBrands,
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
          icon="close-circle"
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
              <MaterialCommunityIcons name={ShopCategoryInfo[shop.category]?.icon || 'store'} size={28} color="#FFFFFF" />
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
              <MaterialCommunityIcons name={shop.isFavorite ? 'star' : 'star-outline'} size={28} color={shop.isFavorite ? '#FFB300' : colors.textLight} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Address */}
        {shop.address && (
          <Card>
            <View style={{flexDirection: 'row', alignItems: 'center'}}><MaterialCommunityIcons name="map-marker" size={16} color={colors.textSecondary} /><Text style={[styles.detailLabel, {color: colors.textSecondary, marginLeft: 4}]}>Address</Text></View>
            <Text style={[styles.detailValue, {color: colors.text}]}>{shop.address}</Text>
          </Card>
        )}

        {/* Website */}
        {shop.isOnline && shop.url && (
          <Card>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <MaterialCommunityIcons name="web" size={16} color={colors.textSecondary} />
              <Text style={[styles.detailLabel, {color: colors.textSecondary, marginLeft: 4}]}>Website</Text>
            </View>
            <Text style={[styles.detailValue, {color: colors.primary}]}>{shop.url}</Text>
          </Card>
        )}

        {/* Notes */}
        {shop.notes && (
          <Card>
            <View style={{flexDirection: 'row', alignItems: 'center'}}><MaterialCommunityIcons name="note-text-outline" size={16} color={colors.textSecondary} /><Text style={[styles.detailLabel, {color: colors.textSecondary, marginLeft: 4}]}>Notes</Text></View>
            <Text style={[styles.detailValue, {color: colors.text}]}>{shop.notes}</Text>
          </Card>
        )}

        {/* Created Date */}
        <Card>
            <View style={{flexDirection: 'row', alignItems: 'center'}}><MaterialCommunityIcons name="calendar" size={16} color={colors.textSecondary} /><Text style={[styles.detailLabel, {color: colors.textSecondary, marginLeft: 4}]}>Added</Text></View>
          <Text style={[styles.detailValue, {color: colors.text}]}>{formatDate(shop.createdAt)}</Text>
        </Card>

        {/* Shop Here Button */}
        {productsAtShop.length > 0 && (
          <TouchableOpacity
            style={[styles.shopHereButton, {backgroundColor: colors.primary}]}
            onPress={() => navigation.navigate('ShopMode', {shopId})}>
            <MaterialCommunityIcons name="cart" size={32} color="#FFFFFF" style={{marginRight: Spacing.base}} />
            <View style={styles.shopHereContent}>
              <Text style={styles.shopHereTitle}>Shop Here</Text>
              <Text style={styles.shopHereSubtitle}>
                {productsAtShop.length} product{productsAtShop.length !== 1 ? 's' : ''} available
                {cheaperAlternatives.length > 0 && ` • ${cheaperAlternatives.length} with warnings`}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Products at this shop */}
        {productsAtShop.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>
              Products ({productsAtShop.length})
            </Text>
            {productsAtShop.slice(0, 5).map(({product, brands}) => {
              const cheapestPrice = Math.min(...brands.map(b => b.price));
              return (
                <Card
                  key={product.id}
                  onPress={() => navigation.navigate('ProductDetail', {productId: product.id})}>
                  <View style={styles.productRow}>
                    <View style={styles.productInfo}>
                      <Text style={[styles.productName, {color: colors.text}]}>
                        {product.name}
                      </Text>
                      <Text style={[styles.brandCount, {color: colors.textSecondary}]}>
                        {brands.length} option{brands.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View style={styles.priceColumn}>
                      <Text style={[styles.priceLabel, {color: colors.textSecondary}]}>from</Text>
                      <Text style={[styles.productPrice, {color: colors.primary}]}>
                        {formatPrice(cheapestPrice, state.settings.currency)}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })}
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
                <View style={{flexDirection: 'row', alignItems: 'center'}}><MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} /><Text style={[styles.scheduleDate, {color: colors.textSecondary, marginLeft: 4}]}>{formatDate(schedule.date)}</Text></View>
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

  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: FontSize.base,
    fontWeight: '500',
  },
  brandCount: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  priceColumn: {
    alignItems: 'flex-end',
    marginLeft: Spacing.base,
  },
  priceLabel: {
    fontSize: FontSize.xs,
  },
  productPrice: {
    fontSize: FontSize.base,
    fontWeight: '700',
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
