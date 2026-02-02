/**
 * Add/Edit Product Screen
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
  ShopProduct,
  ProductCategory,
  ProductCategoryInfo,
} from '../types';
import {Spacing} from '../constants';
import {generateId} from '../utils/helpers';
import {formatPrice} from '../utils/priceHelper';

type NavigationProp = StackNavigationProp<RootStackParamList, 'AddEditProduct'>;
type RouteType = RouteProp<RootStackParamList, 'AddEditProduct'>;

export const AddEditProductScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const {state, addProduct, updateProduct, deleteProduct, addShopProduct, updateShopProduct, deleteShopProduct} = useApp();
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
  const [defaultUnit, setDefaultUnit] = useState(existingProduct?.defaultUnit || '');
  const [notes, setNotes] = useState(existingProduct?.notes || '');

  // Shop prices
  const [shopPrices, setShopPrices] = useState<
    Array<{shopId: string; price: string; shopProductId?: string}>
  >([]);

  // Load existing prices when editing
  useEffect(() => {
    if (isEditing && productId) {
      const existingPrices = state.shopProducts
        .filter(sp => sp.productId === productId)
        .map(sp => ({
          shopId: sp.shopId,
          price: sp.price.toString(),
          shopProductId: sp.id,
        }));
      setShopPrices(existingPrices);
    }
  }, [isEditing, productId, state.shopProducts]);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Product' : 'Add Product',
    });
  }, [navigation, isEditing]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a product name');
      return;
    }

    const now = new Date().toISOString();
    const product: Product = {
      id: productId || generateId(),
      name: name.trim(),
      category,
      defaultUnit: defaultUnit.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: existingProduct?.createdAt || now,
      updatedAt: now,
    };

    if (isEditing) {
      updateProduct(product);
    } else {
      addProduct(product);
    }

    // Save shop prices
    const currentShopProductIds = state.shopProducts
      .filter(sp => sp.productId === product.id)
      .map(sp => sp.id);

    shopPrices.forEach(sp => {
      const price = parseFloat(sp.price);
      if (!isNaN(price) && price > 0) {
        const shopProduct: ShopProduct = {
          id: sp.shopProductId || generateId(),
          productId: product.id,
          shopId: sp.shopId,
          price,
          currency: state.settings.currency,
          lastUpdated: now,
        };

        if (sp.shopProductId) {
          updateShopProduct(shopProduct);
        } else {
          addShopProduct(shopProduct);
        }
      }
    });

    // Remove deleted prices
    const newShopProductIds = shopPrices
      .filter(sp => sp.shopProductId)
      .map(sp => sp.shopProductId!);
    currentShopProductIds.forEach(id => {
      if (!newShopProductIds.includes(id)) {
        deleteShopProduct(id);
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

  const addShopPrice = (shopId: string) => {
    if (!shopPrices.find(sp => sp.shopId === shopId)) {
      setShopPrices([...shopPrices, {shopId, price: ''}]);
    }
  };

  const updateShopPrice = (shopId: string, price: string) => {
    setShopPrices(
      shopPrices.map(sp => (sp.shopId === shopId ? {...sp, price} : sp)),
    );
  };

  const removeShopPrice = (shopId: string) => {
    setShopPrices(shopPrices.filter(sp => sp.shopId !== shopId));
  };

  const categories = Object.entries(ProductCategoryInfo) as Array<
    [ProductCategory, {label: string; icon: string; color: string}]
  >;

  const availableShops = state.shops.filter(
    shop => !shopPrices.find(sp => sp.shopId === shop.id),
  );

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.background}]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      {/* Basic Info */}
      <Text style={[styles.sectionTitle, {color: colors.text}]}>
        Product Info
      </Text>

      <Input
        label="Product Name"
        placeholder="e.g., Whole Wheat Bread"
        value={name}
        onChangeText={setName}
      />

      <Text style={[styles.label, {color: colors.text}]}>Category</Text>
      <View style={styles.categoryGrid}>
        {categories.map(([key, info]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.categoryItem,
              {
                backgroundColor:
                  category === key ? info.color + '30' : colors.surface,
                borderColor: category === key ? info.color : colors.border,
              },
            ]}
            onPress={() => setCategory(key)}>
            <Text style={styles.categoryIcon}>{info.icon}</Text>
            <Text
              style={[
                styles.categoryLabel,
                {color: category === key ? info.color : colors.text},
              ]}>
              {info.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="Default Unit (optional)"
        placeholder="e.g., kg, pcs, bottle"
        value={defaultUnit}
        onChangeText={setDefaultUnit}
      />

      <Input
        label="Notes (optional)"
        placeholder="Any additional notes..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      {/* Shop Prices */}
      <Text style={[styles.sectionTitle, {color: colors.text, marginTop: Spacing.lg}]}>
        Prices at Shops
      </Text>
      <Text style={[styles.sectionDescription, {color: colors.textSecondary}]}>
        Add prices for this product at different shops
      </Text>

      {shopPrices.length === 0 ? (
        <Card>
          <Text style={[styles.noPricesText, {color: colors.textLight}]}>
            No prices added yet. Select a shop below to add a price.
          </Text>
        </Card>
      ) : (
        shopPrices.map(sp => {
          const shop = state.shops.find(s => s.id === sp.shopId);
          if (!shop) return null;

          return (
            <Card key={sp.shopId}>
              <View style={styles.priceRow}>
                <View style={styles.shopInfo}>
                  <Text style={[styles.shopName, {color: colors.text}]}>
                    {shop.name}
                  </Text>
                  <Text style={[styles.shopCategory, {color: colors.textSecondary}]}>
                    {shop.category}
                  </Text>
                </View>
                <View style={styles.priceInputContainer}>
                  <Text style={[styles.currencySymbol, {color: colors.primary}]}>
                    {state.settings.currency}
                  </Text>
                  <Input
                    placeholder="0.00"
                    value={sp.price}
                    onChangeText={text => updateShopPrice(sp.shopId, text)}
                    keyboardType="decimal-pad"
                    style={styles.priceInput}
                  />
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeShopPrice(sp.shopId)}>
                  <Text style={{color: colors.error}}>✕</Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        })
      )}

      {/* Add Shop Price */}
      {availableShops.length > 0 && (
        <>
          <Text style={[styles.label, {color: colors.text, marginTop: Spacing.base}]}>
            Add price at shop
          </Text>
          <View style={styles.shopList}>
            {availableShops.map(shop => (
              <TouchableOpacity
                key={shop.id}
                style={[styles.shopChip, {backgroundColor: colors.surface, borderColor: colors.border}]}
                onPress={() => addShopPrice(shop.id)}>
                <Text style={{color: colors.text}}>+ {shop.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {state.shops.length === 0 && (
        <Card>
          <Text style={[styles.noPricesText, {color: colors.textLight}]}>
            Add shops first to track prices. Go to the Shops tab to add your favorite stores.
          </Text>
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
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: Spacing.base,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.base,
    marginHorizontal: -Spacing.xs,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    margin: Spacing.xs,
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
  },
  shopCategory: {
    fontSize: 12,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    textAlign: 'right',
  },
  removeButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  noPricesText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  shopList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.base,
  },
  shopChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actions: {
    marginTop: Spacing.lg,
    gap: Spacing.base,
  },
  deleteButton: {
    marginTop: Spacing.sm,
  },
});
