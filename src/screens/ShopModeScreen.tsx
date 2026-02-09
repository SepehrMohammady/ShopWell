/**
 * Shop Mode Screen - Shopping at a specific shop with price comparisons
 * Shows all products available at this shop with their brands and prices
 */

import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useApp} from '../context/AppContext';
import {useTheme} from '../context/ThemeContext';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import {
  RootStackParamList,
  ProductCategoryInfo,
  ProductCategory,
  Product,
  ShopProductBrand,
} from '../types';
import {Spacing} from '../constants';
import {
  formatPrice,
  getCheaperAlternatives,
  getCheapestBrandAtShop,
  getCheapestOption,
} from '../utils/priceHelper';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ShopMode'>;
type RouteType = RouteProp<RootStackParamList, 'ShopMode'>;

interface ProductWithBrands {
  product: Product;
  brands: ShopProductBrand[];
  cheapestHere: number;
  cheapestAnywhere: number;
  hasBetterPrice: boolean;
  savings: number;
}

export const ShopModeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const {state, getProductsForShop, toggleProductAvailability} = useApp();
  const {colors} = useTheme();

  const shopId = route.params.shopId;
  const shop = state.shops.find(s => s.id === shopId);

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [showWarningsOnly, setShowWarningsOnly] = useState(false);

  const productsAtShop = useMemo((): ProductWithBrands[] => {
    const rawProducts = getProductsForShop(shopId);
    
    return rawProducts.map(({product, brands}) => {
      const cheapestHere = Math.min(...brands.map(b => b.price));
      const cheapestAnywhereOption = getCheapestOption(product.id, state.shopProductBrands, state.shops);
      const cheapestAnywhere = cheapestAnywhereOption?.price || cheapestHere;
      const hasBetterPrice = cheapestAnywhere < cheapestHere;
      const savings = cheapestHere - cheapestAnywhere;
      
      return {
        product,
        brands,
        cheapestHere,
        cheapestAnywhere,
        hasBetterPrice,
        savings,
      };
    });
  }, [shopId, getProductsForShop, state.shopProductBrands, state.shops]);

  const cheaperAlternatives = useMemo(() => {
    return getCheaperAlternatives(shopId, state.shopProductBrands, state.shops, state.products);
  }, [shopId, state.shopProductBrands, state.shops, state.products]);

  const filteredProducts = useMemo(() => {
    let products = productsAtShop;

    // Filter by category
    if (selectedCategory !== 'all') {
      products = products.filter(p => p.product.category === selectedCategory);
    }

    // Filter by warnings only
    if (showWarningsOnly) {
      products = products.filter(p => p.hasBetterPrice);
    }

    // Sort: warnings first, then by name
    return products.sort((a, b) => {
      if (a.hasBetterPrice && !b.hasBetterPrice) return -1;
      if (!a.hasBetterPrice && b.hasBetterPrice) return 1;
      return a.product.name.localeCompare(b.product.name);
    });
  }, [productsAtShop, selectedCategory, showWarningsOnly]);

  const categories: Array<ProductCategory | 'all'> = [
    'all',
    'personalCare',
    'healthWellness',
    'household',
    'beverages',
    'food',
    'other',
  ];

  if (!shop) {
    return (
      <View style={[styles.container, styles.centered, {backgroundColor: colors.background}]}>
        <Text style={{color: colors.error}}>Shop not found</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={[styles.header, {backgroundColor: colors.primary}]}>
      <MaterialCommunityIcons name="cart" size={36} color="#FFFFFF" style={{marginRight: Spacing.base}} />
      <View style={styles.headerInfo}>
        <Text style={styles.shoppingAt}>Shopping at</Text>
        <Text style={styles.shopName}>{shop.name}</Text>
      </View>
      <View style={styles.statsContainer}>
        <Text style={styles.statValue}>{productsAtShop.length}</Text>
        <Text style={styles.statLabel}>Products</Text>
      </View>
    </View>
  );

  const renderWarningBanner = () => {
    if (cheaperAlternatives.length === 0) {
      return (
        <View style={[styles.successBanner, {backgroundColor: colors.success + '20'}]}>
          <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} style={{marginRight: Spacing.sm}} />
          <Text style={[styles.successText, {color: colors.success}]}>
            All products here have the best prices!
          </Text>
        </View>
      );
    }

    const totalSavings = cheaperAlternatives.reduce((sum, alt) => sum + alt.savings, 0);
    
    return (
      <TouchableOpacity
        style={[styles.warningBanner, {backgroundColor: colors.warning + '20'}]}
        onPress={() => setShowWarningsOnly(!showWarningsOnly)}>
        <MaterialCommunityIcons name="alert" size={20} color={colors.warning} style={{marginRight: Spacing.sm}} />
        <View style={styles.warningInfo}>
          <Text style={[styles.warningText, {color: colors.warning}]}>
            {cheaperAlternatives.length} product{cheaperAlternatives.length !== 1 ? 's' : ''} cheaper elsewhere
          </Text>
          <Text style={[styles.warningSubtext, {color: colors.textSecondary}]}>
            Could save {formatPrice(totalSavings, state.settings.currency)} • Tap to {showWarningsOnly ? 'show all' : 'filter'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryFilter = () => (
    <View style={styles.categoryContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={item => item}
        renderItem={({item}) => {
          const isSelected = item === selectedCategory;
          const categoryInfo = item === 'all' ? null : ProductCategoryInfo[item];
          return (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(item)}>
              {item === 'all' ? (
                <MaterialCommunityIcons name="view-list" size={16} color={isSelected ? '#FFFFFF' : colors.text} style={{marginRight: Spacing.xs}} />
              ) : (
                <MaterialCommunityIcons name={categoryInfo?.icon || 'package-variant'} size={16} color={isSelected ? '#FFFFFF' : colors.text} style={{marginRight: Spacing.xs}} />
              )}
              <Text
                style={[
                  styles.categoryLabel,
                  {color: isSelected ? colors.white : colors.text},
                ]}>
                {item === 'all' ? 'All' : categoryInfo?.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  const renderProduct = ({item}: {item: ProductWithBrands}) => {
    const categoryInfo = ProductCategoryInfo[item.product.category];
    const cheaperAlt = item.hasBetterPrice
      ? cheaperAlternatives.find(alt => alt.product.id === item.product.id)
      : null;

    return (
      <Card onPress={() => navigation.navigate('ProductDetail', {productId: item.product.id})}>
        {/* Warning banner if cheaper elsewhere */}
        {item.hasBetterPrice && cheaperAlt && (
          <View style={[styles.cheaperBanner, {backgroundColor: colors.warning + '15'}]}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={14} color={colors.warning} />
              <Text style={[styles.cheaperText, {color: colors.warning, marginLeft: 4}]}>
                Save {formatPrice(item.savings, state.settings.currency)} at {cheaperAlt.cheapestShop.name} ({cheaperAlt.cheapestBrand.brand})
              </Text>
            </View>
          </View>
        )}

        <View style={styles.productCard}>
          {/* Availability toggle */}
          <TouchableOpacity
            style={[
              styles.availabilityToggle,
              {
                backgroundColor: item.product.isAvailable ? colors.success : colors.border,
                borderColor: item.product.isAvailable ? colors.success : colors.border,
              },
            ]}
            onPress={() => toggleProductAvailability(item.product.id)}>
            {item.product.isAvailable && (
              <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <View style={styles.productInfo}>
            <Text style={[styles.productName, {color: colors.text}]}>
              {item.product.name}
            </Text>
            <View style={styles.productMeta}>
              <View
                style={[
                  styles.categoryTag,
                  {backgroundColor: categoryInfo.color + '20'},
                ]}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <MaterialCommunityIcons name={categoryInfo.icon} size={11} color={categoryInfo.color} />
                  <Text style={[styles.categoryTagText, {color: categoryInfo.color, marginLeft: 2}]}>{categoryInfo.label}</Text>
                </View>
              </View>
              {!item.product.isAvailable && (
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <MaterialCommunityIcons name="cart-outline" size={11} color={colors.primary} />
                  <Text style={[styles.onListBadge, {color: colors.primary, marginLeft: 2}]}>On list</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.priceInfo}>
            <Text style={[styles.priceLabel, {color: colors.textSecondary}]}>
              from
            </Text>
            <Text
              style={[
                styles.priceValue,
                {color: item.hasBetterPrice ? colors.warning : colors.success},
              ]}>
              {formatPrice(item.cheapestHere, state.settings.currency)}
            </Text>
            <Text style={[styles.brandCount, {color: colors.textLight}]}>
              {item.brands.length} option{item.brands.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Brand list */}
        {item.brands.length > 1 && (
          <View style={[styles.brandList, {borderTopColor: colors.border}]}>
            {item.brands.slice(0, 3).map((brand, index) => (
              <View key={brand.id} style={styles.brandRow}>
                <Text style={[styles.brandName, {color: colors.textSecondary}]}>
                  {brand.brand}
                </Text>
                <Text style={[styles.brandPrice, {color: colors.text}]}>
                  {formatPrice(brand.price, state.settings.currency)}
                </Text>
              </View>
            ))}
            {item.brands.length > 3 && (
              <Text style={[styles.moreOptions, {color: colors.textLight}]}>
                +{item.brands.length - 3} more option{item.brands.length - 3 !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      {renderHeader()}

      {/* Warning/Success Banner */}
      {renderWarningBanner()}

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon="package-variant-closed"
          title={showWarningsOnly ? 'No warnings' : 'No products at this shop'}
          message={
            showWarningsOnly
              ? 'All products here are at the best price!'
              : 'Add products with prices to see them here'
          }
        />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.product.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  headerInfo: {
    flex: 1,
  },
  shoppingAt: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  shopName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: 12,
  },

  warningInfo: {
    flex: 1,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: 12,
  },

  successText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryContainer: {
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
  },

  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    padding: Spacing.base,
    paddingTop: 0,
  },
  cheaperBanner: {
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: 8,
  },
  cheaperText: {
    fontSize: 12,
    fontWeight: '500',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },

  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  onListBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  brandCount: {
    fontSize: 11,
    marginTop: 2,
  },
  brandList: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  brandName: {
    fontSize: 13,
  },
  brandPrice: {
    fontSize: 13,
    fontWeight: '500',
  },
  moreOptions: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
