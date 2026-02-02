/**
 * Products Screen - List all products grouped by category
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
import {formatPrice, getCheapestShop} from '../utils/priceHelper';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const ProductsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {state} = useApp();
  const {colors} = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');

  const categories: Array<ProductCategory | 'all'> = [
    'all',
    'food',
    'healthBeauty',
    'household',
    'electronics',
    'clothing',
    'other',
  ];

  const filteredProducts = useMemo(() => {
    let products = state.products;

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
  }, [state.products, selectedCategory, searchQuery]);

  const getProductPriceInfo = (product: Product) => {
    const cheapest = getCheapestShop(product.id, state.shopProducts, state.shops);
    const priceCount = state.shopProducts.filter(sp => sp.productId === product.id).length;
    return {cheapest, priceCount};
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
    const {cheapest, priceCount} = getProductPriceInfo(item);

    return (
      <Card onPress={() => navigation.navigate('ProductDetail', {productId: item.id})}>
        <View style={styles.productCard}>
          <View
            style={[
              styles.categoryBadge,
              {backgroundColor: categoryInfo.color + '20'},
            ]}>
            <Text style={styles.categoryBadgeIcon}>{categoryInfo.icon}</Text>
          </View>
          <View style={styles.productInfo}>
            <Text style={[styles.productName, {color: colors.text}]}>
              {item.name}
            </Text>
            <Text style={[styles.productCategory, {color: colors.textSecondary}]}>
              {categoryInfo.label}
              {item.defaultUnit && ` • ${item.defaultUnit}`}
            </Text>
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
                  {priceCount} shop{priceCount !== 1 ? 's' : ''}
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

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
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
          icon="📦"
          title={searchQuery ? 'No products found' : 'No products yet'}
          message={
            searchQuery
              ? 'Try a different search term'
              : 'Add your first product to start tracking prices'
          }
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
  categoryBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  categoryBadgeIcon: {
    fontSize: 24,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
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
    fontSize: 12,
    marginTop: 2,
  },
  noPrices: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
