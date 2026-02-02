/**
 * Products Screen - List products with availability filter
 * "Shopping List" shows products we need (isAvailable = false)
 * "Available" shows products we have (isAvailable = true)
 */

import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useApp} from '../context/AppContext';
import {useTheme} from '../context/ThemeContext';
import Card from '../components/common/Card';
import FAB from '../components/common/FAB';
import EmptyState from '../components/common/EmptyState';
import {
  RootStackParamList,
  Product,
  ProductCategory,
  ProductCategoryInfo,
} from '../types';
import {Spacing} from '../constants';
import {formatPrice, getCheapestOption, getBestShopsForShoppingList} from '../utils/priceHelper';

type NavigationProp = StackNavigationProp<RootStackParamList>;

type ViewMode = 'shopping' | 'available';

export const ProductsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {state, toggleProductAvailability, getShoppingList} = useApp();
  const {colors} = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('shopping');

  const categories: Array<ProductCategory | 'all'> = [
    'all',
    'personalCare',
    'healthWellness',
    'household',
    'beverages',
    'food',
    'other',
  ];

  const filteredProducts = useMemo(() => {
    // Filter by availability mode
    let products = viewMode === 'shopping'
      ? state.products.filter(p => !p.isAvailable)
      : state.products.filter(p => p.isAvailable);

    // Filter by category
    if (selectedCategory !== 'all') {
      products = products.filter(p => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(query));
    }

    // Sort by name
    return products.sort((a, b) => a.name.localeCompare(b.name));
  }, [state.products, selectedCategory, searchQuery, viewMode]);

  // Best shop recommendation for shopping list
  const bestShops = useMemo(() => {
    if (viewMode !== 'shopping') return [];
    const neededProducts = getShoppingList();
    return getBestShopsForShoppingList(neededProducts, state.shopProductBrands, state.shops);
  }, [viewMode, state.shopProductBrands, state.shops, getShoppingList]);

  const getProductPriceInfo = (product: Product) => {
    const cheapest = getCheapestOption(product.id, state.shopProductBrands, state.shops);
    const brandCount = state.shopProductBrands.filter(spb => spb.productId === product.id).length;
    const shopCount = new Set(
      state.shopProductBrands
        .filter(spb => spb.productId === product.id)
        .map(spb => spb.shopId)
    ).size;
    return {cheapest, brandCount, shopCount};
  };

  const renderViewModeToggle = () => (
    <View style={styles.viewModeContainer}>
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'shopping' && {backgroundColor: colors.primary},
          {borderColor: colors.primary},
        ]}
        onPress={() => setViewMode('shopping')}>
        <Text style={[
          styles.viewModeText,
          {color: viewMode === 'shopping' ? colors.white : colors.primary},
        ]}>
          🛒 Shopping List
        </Text>
        {viewMode === 'shopping' && (
          <View style={[styles.countBadge, {backgroundColor: colors.white}]}>
            <Text style={[styles.countText, {color: colors.primary}]}>
              {state.products.filter(p => !p.isAvailable).length}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'available' && {backgroundColor: colors.success},
          {borderColor: colors.success},
        ]}
        onPress={() => setViewMode('available')}>
        <Text style={[
          styles.viewModeText,
          {color: viewMode === 'available' ? colors.white : colors.success},
        ]}>
          ✓ Available
        </Text>
        {viewMode === 'available' && (
          <View style={[styles.countBadge, {backgroundColor: colors.white}]}>
            <Text style={[styles.countText, {color: colors.success}]}>
              {state.products.filter(p => p.isAvailable).length}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderBestShopBanner = () => {
    if (viewMode !== 'shopping' || bestShops.length === 0) return null;
    const best = bestShops[0];
    
    return (
      <TouchableOpacity 
        style={[styles.bestShopBanner, {backgroundColor: colors.primary + '15'}]}
        onPress={() => navigation.navigate('ShopMode', {shopId: best.shop.id})}>
        <View style={styles.bestShopInfo}>
          <Text style={[styles.bestShopLabel, {color: colors.textSecondary}]}>
            Best place to shop:
          </Text>
          <Text style={[styles.bestShopName, {color: colors.primary}]}>
            {best.shop.name}
          </Text>
          <Text style={[styles.bestShopStats, {color: colors.textSecondary}]}>
            {best.productsAvailable} items • {best.cheapestProducts} cheapest • ~{formatPrice(best.estimatedTotal, state.settings.currency)}
          </Text>
        </View>
        <Text style={styles.bestShopArrow}>→</Text>
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
              <Text style={styles.categoryIcon}>
                {item === 'all' ? '📋' : categoryInfo?.icon}
              </Text>
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

  const renderProduct = ({item}: {item: Product}) => {
    const categoryInfo = ProductCategoryInfo[item.category];
    const {cheapest, brandCount, shopCount} = getProductPriceInfo(item);

    return (
      <Card onPress={() => navigation.navigate('ProductDetail', {productId: item.id})}>
        <View style={styles.productCard}>
          {/* Availability toggle */}
          <TouchableOpacity
            style={[
              styles.availabilityToggle,
              {
                backgroundColor: item.isAvailable ? colors.success : colors.border,
                borderColor: item.isAvailable ? colors.success : colors.border,
              },
            ]}
            onPress={() => toggleProductAvailability(item.id)}>
            <Text style={styles.availabilityIcon}>
              {item.isAvailable ? '✓' : ''}
            </Text>
          </TouchableOpacity>

          <View style={styles.productInfo}>
            <Text style={[styles.productName, {color: colors.text}]}>
              {item.name}
            </Text>
            <View style={styles.productMeta}>
              <View
                style={[
                  styles.categoryTag,
                  {backgroundColor: categoryInfo.color + '20'},
                ]}>
                <Text style={[styles.categoryTagText, {color: categoryInfo.color}]}>
                  {categoryInfo.icon} {categoryInfo.label}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.priceInfo}>
            {cheapest ? (
              <>
                <Text style={[styles.priceLabel, {color: colors.textSecondary}]}>
                  From
                </Text>
                <Text style={[styles.priceValue, {color: colors.primary}]}>
                  {formatPrice(cheapest.price, state.settings.currency)}
                </Text>
                <Text style={[styles.shopCount, {color: colors.textLight}]}>
                  {brandCount} option{brandCount !== 1 ? 's' : ''} • {shopCount} shop{shopCount !== 1 ? 's' : ''}
                </Text>
              </>
            ) : (
              <Text style={[styles.noPrices, {color: colors.textLight}]}>
                No prices
              </Text>
            )}
          </View>
        </View>
      </Card>
    );
  };

  const getEmptyMessage = () => {
    if (searchQuery) return 'Try a different search term';
    if (viewMode === 'shopping') {
      return 'Great! You have everything you need. Add products to your shopping list when you run out.';
    }
    return 'Products you mark as available will appear here.';
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* View Mode Toggle */}
      {renderViewModeToggle()}

      {/* Best Shop Banner (only in shopping mode) */}
      {renderBestShopBanner()}

      {/* Search Bar */}
      <View style={[styles.searchContainer, {backgroundColor: colors.surface}]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, {color: colors.text}]}
          placeholder="Search products..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={viewMode === 'shopping' ? '🎉' : '📦'}
          title={searchQuery ? 'No products found' : (viewMode === 'shopping' ? 'All stocked up!' : 'No available products')}
          message={getEmptyMessage()}
        />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB onPress={() => navigation.navigate('AddEditProduct', {})} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewModeContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    gap: Spacing.sm,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: Spacing.xs,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bestShopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    padding: Spacing.base,
    borderRadius: 12,
  },
  bestShopInfo: {
    flex: 1,
  },
  bestShopLabel: {
    fontSize: 12,
  },
  bestShopName: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  bestShopStats: {
    fontSize: 12,
    marginTop: 2,
  },
  bestShopArrow: {
    fontSize: 20,
    marginLeft: Spacing.base,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.base,
    marginBottom: 0,
    paddingHorizontal: Spacing.base,
    borderRadius: 12,
    height: 48,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearIcon: {
    fontSize: 16,
    padding: Spacing.sm,
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
    fontSize: 14,
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
  availabilityToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  availabilityIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
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
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 12,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  shopCount: {
    fontSize: 11,
    marginTop: 2,
  },
  noPrices: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
