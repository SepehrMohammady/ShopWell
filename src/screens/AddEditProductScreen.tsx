/**
 * Add/Edit Product Screen
 * Supports multiple brands with different prices at each shop
 */

import React, {useState, useEffect} from 'react';
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
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import {
  RootStackParamList,
  Product,
  ShopProductBrand,
  ProductCategory,
  ProductCategoryInfo,
} from '../types';
import {Spacing} from '../constants';
import {generateId} from '../utils/helpers';
import {formatPrice} from '../utils/priceHelper';

type NavigationProp = StackNavigationProp<RootStackParamList, 'AddEditProduct'>;
type RouteType = RouteProp<RootStackParamList, 'AddEditProduct'>;

interface BrandPriceEntry {
  id: string;
  shopId: string;
  brand: string;
  price: string;
  existingId?: string; // ID of existing ShopProductBrand if editing
}

export const AddEditProductScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const {
    state,
    addProduct,
    updateProduct,
    deleteProduct,
    addShopProductBrand,
    updateShopProductBrand,
    deleteShopProductBrand,
    deleteShopProductBrandsForProduct,
  } = useApp();
  const {colors} = useTheme();

  const productId = route.params?.productId;
  const isEditing = !!productId;

  const existingProduct = isEditing
    ? state.products.find(p => p.id === productId)
    : undefined;

  const [name, setName] = useState(existingProduct?.name || '');
  const [category, setCategory] = useState<ProductCategory>(
    existingProduct?.category || 'other',
  );
  const [isAvailable, setIsAvailable] = useState(existingProduct?.isAvailable ?? false);
  const [notes, setNotes] = useState(existingProduct?.notes || '');

  // Brand prices - each entry is a shop+brand+price combination
  const [brandPrices, setBrandPrices] = useState<BrandPriceEntry[]>([]);

  // Load existing brand prices when editing
  useEffect(() => {
    if (isEditing && productId) {
      const existingPrices = state.shopProductBrands
        .filter(spb => spb.productId === productId)
        .map(spb => ({
          id: generateId(),
          shopId: spb.shopId,
          brand: spb.brand,
          price: spb.price.toString(),
          existingId: spb.id,
        }));
      setBrandPrices(existingPrices);
    }
  }, [isEditing, productId, state.shopProductBrands]);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Product' : 'Add Product',
    });
  }, [navigation, isEditing]);

  const handleAddBrandPrice = () => {
    if (state.shops.length === 0) {
      Alert.alert('No Shops', 'Please add a shop first before adding prices.');
      return;
    }
    setBrandPrices([
      ...brandPrices,
      {id: generateId(), shopId: state.shops[0].id, brand: '', price: ''},
    ]);
  };

  const handleRemoveBrandPrice = (id: string) => {
    setBrandPrices(brandPrices.filter(bp => bp.id !== id));
  };

  const handleUpdateBrandPrice = (
    id: string,
    field: 'shopId' | 'brand' | 'price',
    value: string,
  ) => {
    setBrandPrices(
      brandPrices.map(bp => (bp.id === id ? {...bp, [field]: value} : bp)),
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a product name');
      return;
    }

    const now = new Date().toISOString();
    const finalProductId = productId || generateId();

    const product: Product = {
      id: finalProductId,
      name: name.trim(),
      category,
      isAvailable,
      notes: notes.trim() || undefined,
      createdAt: existingProduct?.createdAt || now,
      updatedAt: now,
    };

    if (isEditing) {
      updateProduct(product);
    } else {
      addProduct(product);
    }

    // Track which existing brand prices to keep
    const existingIds = state.shopProductBrands
      .filter(spb => spb.productId === finalProductId)
      .map(spb => spb.id);

    const processedExistingIds: string[] = [];

    // Save brand prices
    brandPrices.forEach(bp => {
      const price = parseFloat(bp.price);
      if (!isNaN(price) && price > 0 && bp.brand.trim()) {
        const shopProductBrand: ShopProductBrand = {
          id: bp.existingId || generateId(),
          productId: finalProductId,
          shopId: bp.shopId,
          brand: bp.brand.trim(),
          price,
          currency: state.settings.currency,
          lastUpdated: now,
        };

        if (bp.existingId) {
          updateShopProductBrand(shopProductBrand);
          processedExistingIds.push(bp.existingId);
        } else {
          addShopProductBrand(shopProductBrand);
        }
      }
    });

    // Delete brand prices that were removed
    existingIds.forEach(id => {
      if (!processedExistingIds.includes(id)) {
        deleteShopProductBrand(id);
      }
    });

    navigation.goBack();
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
            if (productId) {
              deleteProduct(productId);
              navigation.goBack();
            }
          },
        },
      ],
    );
  };

  const categories: ProductCategory[] = [
    'personalCare',
    'healthWellness',
    'household',
    'beverages',
    'food',
    'other',
  ];

  const renderCategorySelector = () => (
    <View style={styles.categoryGrid}>
      {categories.map(cat => {
        const info = ProductCategoryInfo[cat];
        const isSelected = category === cat;
        return (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryOption,
              {
                backgroundColor: isSelected ? info.color : colors.surface,
                borderColor: isSelected ? info.color : colors.border,
              },
            ]}
            onPress={() => setCategory(cat)}>
            <Text style={styles.categoryOptionIcon}>{info.icon}</Text>
            <Text
              style={[
                styles.categoryOptionLabel,
                {color: isSelected ? colors.white : colors.text},
              ]}>
              {info.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderBrandPriceEntry = (entry: BrandPriceEntry, index: number) => {
    const shop = state.shops.find(s => s.id === entry.shopId);

    return (
      <Card key={entry.id}>
        <View style={styles.brandPriceEntry}>
          <View style={styles.brandPriceHeader}>
            <Text style={[styles.brandPriceTitle, {color: colors.text}]}>
              Option {index + 1}
            </Text>
            <TouchableOpacity
              onPress={() => handleRemoveBrandPrice(entry.id)}
              style={styles.removeButton}>
              <Text style={[styles.removeButtonText, {color: colors.error}]}>
                ✕ Remove
              </Text>
            </TouchableOpacity>
          </View>

          {/* Shop selector */}
          <Text style={[styles.fieldLabel, {color: colors.textSecondary}]}>
            Shop
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.shopSelector}>
            {state.shops.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.shopChip,
                  {
                    backgroundColor:
                      entry.shopId === s.id ? colors.primary : colors.surface,
                    borderColor:
                      entry.shopId === s.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleUpdateBrandPrice(entry.id, 'shopId', s.id)}>
                <Text
                  style={[
                    styles.shopChipText,
                    {color: entry.shopId === s.id ? colors.white : colors.text},
                  ]}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Brand and Price in row */}
          <View style={styles.brandPriceRow}>
            <View style={styles.brandInput}>
              <Input
                label="Brand"
                value={entry.brand}
                onChangeText={v => handleUpdateBrandPrice(entry.id, 'brand', v)}
                placeholder="e.g., Alpro, Oatly..."
              />
            </View>
            <View style={styles.priceInput}>
              <Input
                label={`Price (${state.settings.currency})`}
                value={entry.price}
                onChangeText={v => handleUpdateBrandPrice(entry.id, 'price', v)}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.background}]}
      contentContainerStyle={styles.content}>
      {/* Basic Info */}
      <Input
        label="Product Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g., Milk, Shampoo, Bread..."
      />

      {/* Category */}
      <Text style={[styles.sectionTitle, {color: colors.text}]}>Category</Text>
      {renderCategorySelector()}

      {/* Availability Toggle */}
      <View style={styles.availabilitySection}>
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          Availability
        </Text>
        <View style={styles.availabilityRow}>
          <TouchableOpacity
            style={[
              styles.availabilityOption,
              {
                backgroundColor: !isAvailable ? colors.primary : colors.surface,
                borderColor: !isAvailable ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setIsAvailable(false)}>
            <Text style={styles.availabilityIcon}>🛒</Text>
            <Text
              style={[
                styles.availabilityLabel,
                {color: !isAvailable ? colors.white : colors.text},
              ]}>
              Need to Buy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.availabilityOption,
              {
                backgroundColor: isAvailable ? colors.success : colors.surface,
                borderColor: isAvailable ? colors.success : colors.border,
              },
            ]}
            onPress={() => setIsAvailable(true)}>
            <Text style={styles.availabilityIcon}>✓</Text>
            <Text
              style={[
                styles.availabilityLabel,
                {color: isAvailable ? colors.white : colors.text},
              ]}>
              Available
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notes */}
      <Input
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Any additional notes..."
        multiline
      />

      {/* Brand Prices Section */}
      <Text style={[styles.sectionTitle, {color: colors.text, marginTop: Spacing.lg}]}>
        Prices by Shop & Brand
      </Text>
      <Text style={[styles.sectionSubtitle, {color: colors.textSecondary}]}>
        Add different brands and their prices at various shops
      </Text>

      {brandPrices.map((entry, index) => renderBrandPriceEntry(entry, index))}

      <TouchableOpacity
        style={[styles.addBrandButton, {borderColor: colors.primary}]}
        onPress={handleAddBrandPrice}>
        <Text style={[styles.addBrandButtonText, {color: colors.primary}]}>
          + Add Brand/Price
        </Text>
      </TouchableOpacity>

      {/* Summary */}
      {brandPrices.length > 0 && (
        <Card>
          <Text style={[styles.summaryTitle, {color: colors.text}]}>
            Summary
          </Text>
          {(() => {
            const validEntries = brandPrices.filter(
              bp => bp.brand.trim() && parseFloat(bp.price) > 0,
            );
            const shopGroups = validEntries.reduce((acc, bp) => {
              const shop = state.shops.find(s => s.id === bp.shopId);
              const shopName = shop?.name || 'Unknown';
              if (!acc[shopName]) acc[shopName] = [];
              acc[shopName].push(bp);
              return acc;
            }, {} as Record<string, BrandPriceEntry[]>);

            return Object.entries(shopGroups).map(([shopName, entries]) => (
              <View key={shopName} style={styles.summaryShop}>
                <Text style={[styles.summaryShopName, {color: colors.text}]}>
                  📍 {shopName}
                </Text>
                {entries.map(e => (
                  <Text
                    key={e.id}
                    style={[styles.summaryBrand, {color: colors.textSecondary}]}>
                    • {e.brand}: {formatPrice(parseFloat(e.price), state.settings.currency)}
                  </Text>
                ))}
              </View>
            ));
          })()}
        </Card>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Button title={isEditing ? 'Save Changes' : 'Add Product'} onPress={handleSave} />
        {isEditing && (
          <Button
            title="Delete Product"
            onPress={handleDelete}
            variant="outline"
            style={{...styles.deleteButton, borderColor: colors.error}}
            textStyle={{color: colors.error}}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.base,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryOptionIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  categoryOptionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  availabilitySection: {
    marginBottom: Spacing.base,
  },
  availabilityRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  availabilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: Spacing.xs,
  },
  availabilityIcon: {
    fontSize: 18,
  },
  availabilityLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  brandPriceEntry: {
    marginBottom: Spacing.sm,
  },
  brandPriceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  brandPriceTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    padding: Spacing.xs,
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  shopSelector: {
    marginBottom: Spacing.sm,
  },
  shopChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  shopChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  brandPriceRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  brandInput: {
    flex: 2,
  },
  priceInput: {
    flex: 1,
  },
  addBrandButton: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  addBrandButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  summaryShop: {
    marginBottom: Spacing.sm,
  },
  summaryShopName: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryBrand: {
    fontSize: 12,
    marginLeft: Spacing.base,
    marginTop: 2,
  },
  actions: {
    marginTop: Spacing.lg,
    gap: Spacing.base,
  },
  deleteButton: {
    marginTop: Spacing.sm,
  },
});
