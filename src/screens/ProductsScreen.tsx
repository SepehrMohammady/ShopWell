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
  Image,
  Share,
  Modal,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useApp} from '../context/AppContext';
import {useTheme} from '../context/ThemeContext';
import Card from '../components/common/Card';
import FAB from '../components/common/FAB';
import EmptyState from '../components/common/EmptyState';
import {useAlert} from '../components/common';
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
  const {showAlert} = useAlert();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('shopping');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareProductIds, setShareProductIds] = useState<string[]>([]);

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

  const handleOpenShare = () => {
    // Default: shopping list items (not available)
    const shoppingIds = state.products.filter(p => !p.isAvailable).map(p => p.id);
    setShareProductIds(shoppingIds);
    setShowShareModal(true);
  };

  const handleShareList = async () => {
    const products = shareProductIds
      .map(id => state.products.find(p => p.id === id))
      .filter((p): p is Product => !!p);

    if (products.length === 0) {
      showAlert({title: 'Nothing to share', message: 'Select at least one product to share.'});
      return;
    }

    const lines = products.map((p, i) => `${i + 1}. ${p.name}`);

    const shopSuggestions = getBestShopsForShoppingList(products, state.shopProductBrands, state.shops);
    const shopLines = shopSuggestions.slice(0, 2).map(s =>
      `🏪 ${s.shop.name} — ${s.productsAvailable} item${s.productsAvailable !== 1 ? 's' : ''}, ~${formatPrice(s.estimatedTotal, state.settings.currency)}`,
    );
    const shopSection = shopLines.length > 0 ? `\nSuggested shop${shopLines.length > 1 ? 's' : ''}:\n${shopLines.join('\n')}\n` : '';

    const text = `🛒 Shopping List (${products.length} items)\n\n${lines.join('\n')}\n${shopSection}\n📱 Shared from ShopWell`;

    setShowShareModal(false);
    try {
      await Share.share({message: text});
    } catch {}
  };

  const toggleShareProduct = (id: string) => {
    setShareProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
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
        <MaterialCommunityIcons
          name="cart-outline"
          size={16}
          color={viewMode === 'shopping' ? colors.white : colors.primary}
        />
        <Text style={[
          styles.viewModeText,
          {color: viewMode === 'shopping' ? colors.white : colors.primary},
        ]}>
          Shopping List
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
        <MaterialCommunityIcons
          name="check"
          size={16}
          color={viewMode === 'available' ? colors.white : colors.success}
        />
        <Text style={[
          styles.viewModeText,
          {color: viewMode === 'available' ? colors.white : colors.success},
        ]}>
          Available
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
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={colors.primary}
          style={styles.bestShopArrow}
        />
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
              <MaterialCommunityIcons
                name={item === 'all' ? 'view-list' : categoryInfo!.icon}
                size={16}
                color={isSelected ? colors.white : colors.text}
                style={styles.categoryIconStyle}
              />
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
            {item.isAvailable && (
              <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <View style={styles.productInfo}>
            <View style={styles.productNameRow}>
              {item.imageUri && (
                <Image source={{uri: item.imageUri}} style={styles.productThumbnail} />
              )}
              <Text style={[styles.productName, {color: colors.text}, item.imageUri && {flex: 1}]}>
                {item.name}
              </Text>
            </View>
            <View style={styles.productMeta}>
              <View
                style={[
                  styles.categoryTag,
                  {backgroundColor: categoryInfo.color + '20'},
                ]}>
                <View style={styles.categoryTagContent}>
                  <MaterialCommunityIcons
                    name={categoryInfo.icon}
                    size={12}
                    color={categoryInfo.color}
                  />
                  <Text style={[styles.categoryTagText, {color: categoryInfo.color}]}>
                    {categoryInfo.label}
                  </Text>
                </View>
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

      {/* Best Shop Banner + Share Button (only in shopping mode) */}
      {viewMode === 'shopping' && (
        <View style={styles.shoppingActions}>
          {renderBestShopBanner()}
          <TouchableOpacity
            style={[styles.shareButton, {backgroundColor: colors.primary + '15'}]}
            onPress={handleOpenShare}>
            <MaterialCommunityIcons name="share-variant" size={18} color={colors.primary} />
            <Text style={[styles.shareButtonText, {color: colors.primary}]}>Share List</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      <View style={[styles.searchContainer, {backgroundColor: colors.surface}]}>
        <MaterialCommunityIcons
          name="magnify"
          size={18}
          color={colors.textLight}
          style={styles.searchIconStyle}
        />
        <TextInput
          style={[styles.searchInput, {color: colors.text}]}
          placeholder="Search products..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons
              name="close"
              size={16}
              color={colors.textLight}
              style={styles.clearIconStyle}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={viewMode === 'shopping' ? 'party-popper' : 'package-variant-closed'}
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

      {/* Share Modal */}
      <Modal visible={showShareModal} transparent animationType="slide">
        <View style={[styles.modalOverlay]}>
          <View style={[styles.modalContent, {backgroundColor: colors.surface}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>Share Shopping List</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, {color: colors.textSecondary}]}>
              Select products to include ({shareProductIds.length} selected)
            </Text>
            <FlatList
              data={state.products}
              keyExtractor={item => item.id}
              style={styles.shareList}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[styles.shareItem, {borderBottomColor: colors.border}]}
                  onPress={() => toggleShareProduct(item.id)}>
                  <MaterialCommunityIcons
                    name={shareProductIds.includes(item.id) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={22}
                    color={shareProductIds.includes(item.id) ? colors.primary : colors.textLight}
                  />
                  <Text style={[styles.shareItemText, {color: colors.text}]}>{item.name}</Text>
                  <Text style={[styles.shareItemCategory, {color: colors.textSecondary}]}>
                    {ProductCategoryInfo[item.category]?.label || item.category}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <View style={styles.shareActions}>
              <TouchableOpacity
                style={[styles.shareSelectAll, {borderColor: colors.border}]}
                onPress={() => {
                  if (shareProductIds.length === state.products.length) {
                    setShareProductIds([]);
                  } else {
                    setShareProductIds(state.products.map(p => p.id));
                  }
                }}>
                <Text style={[styles.shareSelectAllText, {color: colors.textSecondary}]}>
                  {shareProductIds.length === state.products.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shareConfirmButton, {backgroundColor: colors.primary}]}
                onPress={handleShareList}>
                <MaterialCommunityIcons name="share-variant" size={18} color={colors.white} />
                <Text style={[styles.shareConfirmText, {color: colors.white}]}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  searchIconStyle: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearIconStyle: {
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
  categoryIconStyle: {
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
  productInfo: {
    flex: 1,
  },
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productThumbnail: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: Spacing.sm,
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
  categoryTagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  shoppingActions: {
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.base,
    borderRadius: 10,
    gap: 6,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: Spacing.base,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.base,
  },
  shareList: {
    maxHeight: 400,
  },
  shareItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    gap: Spacing.sm,
  },
  shareItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  shareItemCategory: {
    fontSize: 12,
  },
  shareActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.base,
    gap: Spacing.base,
  },
  shareSelectAll: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderRadius: 10,
  },
  shareSelectAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  shareConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  shareConfirmText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
