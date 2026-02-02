/**
 * Product Detail Screen - View product with prices across shops
 * Shows all brand options grouped by shop
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useApp} from '../context/AppContext';
import {useTheme} from '../context/ThemeContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import {RootStackParamList, ProductCategoryInfo} from '../types';
import {Spacing} from '../constants';
import {formatPrice, getAllPricesForProduct, getPriceRange} from '../utils/priceHelper';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ProductDetail'>;
type RouteType = RouteProp<RootStackParamList, 'ProductDetail'>;

export const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const {state, deleteProduct, toggleProductAvailability} = useApp();
  const {colors} = useTheme();

  const productId = route.params.productId;
  const product = state.products.find(p => p.id === productId);

  if (!product) {
    return (
      <View style={[styles.container, styles.centered, {backgroundColor: colors.background}]}>
        <Text style={{color: colors.error}}>Product not found</Text>
      </View>
    );
  }

  const categoryInfo = ProductCategoryInfo[product.category];
  const allPrices = getAllPricesForProduct(productId, state.shopProductBrands, state.shops);
  const priceRange = getPriceRange(productId, state.shopProductBrands);
  const totalBrands = state.shopProductBrands.filter(spb => spb.productId === productId).length;

  const handleEdit = () => {
    navigation.navigate('AddEditProduct', {productId});
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This will also remove all price data.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProduct(productId);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleToggleAvailability = () => {
    toggleProductAvailability(productId);
  };

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.background}]}
      contentContainerStyle={styles.content}>
      {/* Header Card */}
      <Card>
        <View style={styles.header}>
          <View
            style={[
              styles.categoryBadge,
              {backgroundColor: categoryInfo.color + '20'},
            ]}>
            <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.productName, {color: colors.text}]}>
              {product.name}
            </Text>
            <Text style={[styles.categoryLabel, {color: categoryInfo.color}]}>
              {categoryInfo.label}
            </Text>
          </View>
        </View>

        {/* Availability Toggle */}
        <TouchableOpacity
          style={[
            styles.availabilityBadge,
            {
              backgroundColor: product.isAvailable
                ? colors.success + '20'
                : colors.primary + '20',
            },
          ]}
          onPress={handleToggleAvailability}>
          <Text style={styles.availabilityIcon}>
            {product.isAvailable ? '✓' : '🛒'}
          </Text>
          <Text
            style={[
              styles.availabilityText,
              {color: product.isAvailable ? colors.success : colors.primary},
            ]}>
            {product.isAvailable ? 'Available - tap to add to shopping list' : 'On shopping list - tap when purchased'}
          </Text>
        </TouchableOpacity>

        {product.notes && (
          <View style={[styles.notesSection, {borderTopColor: colors.border}]}>
            <Text style={[styles.notesLabel, {color: colors.textSecondary}]}>
              Notes
            </Text>
            <Text style={[styles.notes, {color: colors.text}]}>
              {product.notes}
            </Text>
          </View>
        )}
      </Card>

      {/* Price Overview */}
      {priceRange && (
        <Card>
          <View style={styles.priceOverview}>
            <View style={styles.priceOverviewItem}>
              <Text style={[styles.priceOverviewLabel, {color: colors.textSecondary}]}>
                Lowest
              </Text>
              <Text style={[styles.priceOverviewValue, {color: colors.success}]}>
                {formatPrice(priceRange.min, state.settings.currency)}
              </Text>
            </View>
            <View style={[styles.priceOverviewDivider, {backgroundColor: colors.border}]} />
            <View style={styles.priceOverviewItem}>
              <Text style={[styles.priceOverviewLabel, {color: colors.textSecondary}]}>
                Highest
              </Text>
              <Text style={[styles.priceOverviewValue, {color: colors.error}]}>
                {formatPrice(priceRange.max, state.settings.currency)}
              </Text>
            </View>
            <View style={[styles.priceOverviewDivider, {backgroundColor: colors.border}]} />
            <View style={styles.priceOverviewItem}>
              <Text style={[styles.priceOverviewLabel, {color: colors.textSecondary}]}>
                Options
              </Text>
              <Text style={[styles.priceOverviewValue, {color: colors.text}]}>
                {totalBrands}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Prices by Shop */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          Prices by Shop
        </Text>
        <Text style={[styles.sectionSubtitle, {color: colors.textSecondary}]}>
          {allPrices.length} shop{allPrices.length !== 1 ? 's' : ''} carrying this product
        </Text>
      </View>

      {allPrices.length === 0 ? (
        <Card>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={[styles.emptyTitle, {color: colors.text}]}>
              No prices yet
            </Text>
            <Text style={[styles.emptyDescription, {color: colors.textSecondary}]}>
              Add price information to compare across shops
            </Text>
          </View>
        </Card>
      ) : (
        allPrices.map((shopData, shopIndex) => {
          const isCheapestShop = shopIndex === 0;
          
          return (
            <Card 
              key={shopData.shop.id}
              onPress={() => navigation.navigate('ShopMode', {shopId: shopData.shop.id})}>
              <View style={styles.shopCard}>
                <View style={styles.shopHeader}>
                  <View style={styles.shopInfo}>
                    <View style={styles.shopNameRow}>
                      <Text style={[styles.shopName, {color: colors.text}]}>
                        {shopData.shop.name}
                      </Text>
                      {isCheapestShop && (
                        <View style={[styles.cheapestBadge, {backgroundColor: colors.success}]}>
                          <Text style={styles.cheapestText}>BEST PRICE</Text>
                        </View>
                      )}
                    </View>
                    {shopData.shop.address && (
                      <Text style={[styles.shopAddress, {color: colors.textSecondary}]}>
                        {shopData.shop.address}
                      </Text>
                    )}
                  </View>
                  <View style={styles.shopPriceInfo}>
                    <Text style={[styles.fromLabel, {color: colors.textSecondary}]}>
                      from
                    </Text>
                    <Text style={[styles.shopPrice, {color: isCheapestShop ? colors.success : colors.primary}]}>
                      {formatPrice(shopData.cheapestPrice, state.settings.currency)}
                    </Text>
                  </View>
                </View>

                {/* Brand list */}
                <View style={[styles.brandList, {borderTopColor: colors.border}]}>
                  {shopData.brands.map((brand, brandIndex) => (
                    <View key={brand.id} style={styles.brandRow}>
                      <View style={styles.brandInfo}>
                        <Text style={[styles.brandName, {color: colors.text}]}>
                          {brand.brand}
                        </Text>
                        {brandIndex === 0 && shopData.brands.length > 1 && (
                          <Text style={[styles.cheapestAtShop, {color: colors.success}]}>
                            cheapest here
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.brandPrice, {color: colors.text}]}>
                        {formatPrice(brand.price, state.settings.currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </Card>
          );
        })
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Button title="Edit Product" onPress={handleEdit} />
        <Button
          title="Delete Product"
          onPress={handleDelete}
          variant="outline"
          style={{borderColor: colors.error}}
          textStyle={{color: colors.error}}
        />
      </View>

      {/* Meta Info */}
      <View style={styles.meta}>
        <Text style={[styles.metaText, {color: colors.textLight}]}>
          Created: {new Date(product.createdAt).toLocaleDateString()}
        </Text>
        <Text style={[styles.metaText, {color: colors.textLight}]}>
          Updated: {new Date(product.updatedAt).toLocaleDateString()}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  categoryIcon: {
    fontSize: 32,
  },
  headerInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: 12,
    marginTop: Spacing.base,
  },
  availabilityIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  notesSection: {
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
  },
  priceOverview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceOverviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceOverviewLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  priceOverviewValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  priceOverviewDivider: {
    width: 1,
    height: 40,
  },
  section: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  shopCard: {},
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  shopInfo: {
    flex: 1,
  },
  shopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
  },
  cheapestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cheapestText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shopAddress: {
    fontSize: 13,
    marginTop: 2,
  },
  shopPriceInfo: {
    alignItems: 'flex-end',
  },
  fromLabel: {
    fontSize: 11,
  },
  shopPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  brandList: {
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandName: {
    fontSize: 14,
  },
  cheapestAtShop: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  brandPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  actions: {
    marginTop: Spacing.lg,
    gap: Spacing.base,
  },
  meta: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
  },
});
