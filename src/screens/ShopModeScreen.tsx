/**
 * Shop Mode Screen - Shopping at a specific shop with price comparisons
 */

import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
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
} from '../types';
import {Spacing} from '../constants';
import {
  formatPrice,
  getPriceComparison,
  getCheaperAlternatives,
} from '../utils/priceHelper';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ShopMode'>;
type RouteType = RouteProp<RootStackParamList, 'ShopMode'>;

export const ShopModeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const {state, getProductsForShop} = useApp();
  const {colors} = useTheme();

  const shopId = route.params.shopId;
  const shop = state.shops.find(s => s.id === shopId);

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [showWarningsOnly, setShowWarningsOnly] = useState(false);

  const productsAtShop = useMemo(() => {
    return getProductsForShop(shopId);
  }, [shopId, getProductsForShop]);

  const cheaperAlternatives = useMemo(() => {
    return getCheaperAlternatives(shopId, state.shopProducts, state.shops, state.products);
  }, [shopId, state.shopProducts, state.shops, state.products]);

  const filteredProducts = useMemo(() => {
    let products = productsAtShop;

    // Filter by category
    if (selectedCategory !== 'all') {
      products = products.filter(p => p.product.category === selectedCategory);
    }

    // Filter to show only items cheaper elsewhere
    if (showWarningsOnly) {
      const cheaperIds = cheaperAlternatives.map(ca => ca.product.id);
      products = products.filter(p => cheaperIds.includes(p.product.id));
    }

    return products.sort((a, b) => a.product.name.localeCompare(b.product.name));
  }, [productsAtShop, selectedCategory, showWarningsOnly, cheaperAlternatives]);

  const categories: Array<ProductCategory | 'all'> = [
    'all',
    'food',
    'healthBeauty',
    'household',
    'electronics',
    'clothing',
    'other',
  ];

  // Filter to only categories that have products at this shop
  const availableCategories = categories.filter(cat => {
    if (cat === 'all') return true;
    return productsAtShop.some(p => p.product.category === cat);
  });

  if (!shop) {
    return (
      <View style={[styles.container, styles.centered, {backgroundColor: colors.background}]}>
        <Text style={{color: colors.error}}>Shop not found</Text>
      </View>
    );
  }

  const renderCategoryFilter = () => (
    <View style={styles.categoryContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={availableCategories}
        keyExtractor={item => item}
        renderItem={({item}) => {
          const isSelected = item === selectedCategory;
          const categoryInfo = item === 'all' ? null : ProductCategoryInfo[item];
          const count =
            item === 'all'
              ? productsAtShop.length
              : productsAtShop.filter(p => p.product.category === item).length;

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
              <Text style={styles.categoryIcon}>
                {item === 'all' ? '📋' : categoryInfo?.icon}
              </Text>
              <Text
                style={[
                  styles.categoryLabel,
                  {color: isSelected ? colors.white : colors.text},
                ]}>
                {item === 'all' ? 'All' : categoryInfo?.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  const renderProduct = ({item}: {item: typeof productsAtShop[0]}) => {
    const {product, shopProduct} = item;
    const categoryInfo = ProductCategoryInfo[product.category];
    const comparison = getPriceComparison(
      product.id,
      shopId,
      state.shopProducts,
      state.shops,
    );

    const hasCheaperOption = comparison && !comparison.isCheapest;

    return (
      <Card onPress={() => navigation.navigate('ProductDetail', {productId: product.id})}>
        <View style={styles.productCard}>
          {/* Warning indicator */}
          {hasCheaperOption && (
            <View style={[styles.warningBadge, {backgroundColor: colors.warning + '20'}]}>
              <Text style={styles.warningIcon}>⚠️</Text>
            </View>
          )}

          <View
            style={[
              styles.categoryBadge,
              {backgroundColor: categoryInfo.color + '20'},
            ]}>
            <Text style={styles.categoryBadgeIcon}>{categoryInfo.icon}</Text>
          </View>

          <View style={styles.productInfo}>
            <Text style={[styles.productName, {color: colors.text}]}>
              {product.name}
            </Text>
            {product.defaultUnit && (
              <Text style={[styles.productUnit, {color: colors.textSecondary}]}>
                {product.defaultUnit}
              </Text>
            )}
          </View>

          <View style={styles.priceSection}>
            <Text style={[styles.price, {color: colors.text}]}>
              {formatPrice(shopProduct.price, state.settings.currency)}
            </Text>
            {hasCheaperOption && comparison && (
              <View style={styles.savingsInfo}>
                <Text style={[styles.cheaperAt, {color: colors.warning}]}>
                  Cheaper at {comparison.cheapestShopName}
                </Text>
                <Text style={[styles.savingsAmount, {color: colors.success}]}>
                  Save {formatPrice(comparison.savings, state.settings.currency)}
                </Text>
              </View>
            )}
            {comparison?.isCheapest && (
              <View style={[styles.bestPriceBadge, {backgroundColor: colors.success + '20'}]}>
                <Text style={[styles.bestPriceText, {color: colors.success}]}>
                  Best price
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Shop Header */}
      <View style={[styles.header, {backgroundColor: colors.primary}]}>
        <Text style={styles.shopEmoji}>🛒</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.shoppingAt}>Shopping at</Text>
          <Text style={styles.shopName}>{shop.name}</Text>
        </View>
        <View style={styles.statsContainer}>
          <Text style={styles.statValue}>{productsAtShop.length}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
      </View>

      {/* Warnings Summary */}
      {cheaperAlternatives.length > 0 && (
        <TouchableOpacity
          style={[
            styles.warningBanner,
            {
              backgroundColor: showWarningsOnly ? colors.warning : colors.warning + '20',
            },
          ]}
          onPress={() => setShowWarningsOnly(!showWarningsOnly)}>
          <Text
            style={[
              styles.warningText,
              {color: showWarningsOnly ? colors.white : colors.warning},
            ]}>
            ⚠️ {cheaperAlternatives.length} item
            {cheaperAlternatives.length !== 1 ? 's' : ''} cheaper elsewhere
            {showWarningsOnly ? ' (tap to show all)' : ' (tap to filter)'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon="📦"
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
          keyExtractor={item => item.shopProduct.id}
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
  shopEmoji: {
    fontSize: 36,
    marginRight: Spacing.base,
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
    padding: Spacing.base,
    alignItems: 'center',
  },
  warningText: {
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
  categoryIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    padding: Spacing.base,
    paddingTop: 0,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  warningIcon: {
    fontSize: 14,
  },
  categoryBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  categoryBadgeIcon: {
    fontSize: 22,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
  },
  productUnit: {
    fontSize: 12,
    marginTop: 2,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
  },
  savingsInfo: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  cheaperAt: {
    fontSize: 11,
    fontWeight: '500',
  },
  savingsAmount: {
    fontSize: 12,
    fontWeight: '600',
  },
  bestPriceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  bestPriceText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
