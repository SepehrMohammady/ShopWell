/**
 * Product Detail Screen - View product with prices across shops
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
import {formatPrice, getAllPricesForProduct} from '../utils/priceHelper';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ProductDetail'>;
type RouteType = RouteProp<RootStackParamList, 'ProductDetail'>;

export const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const {state, deleteProduct} = useApp();
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
  const allPrices = getAllPricesForProduct(productId, state.shopProducts, state.shops);
  const cheapestPrice = allPrices.length > 0 ? allPrices[0].price : null;

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

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.background}]}
      contentContainerStyle={styles.content}>
      {/* Product Header */}
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
            {product.defaultUnit && (
              <Text style={[styles.unit, {color: colors.textSecondary}]}>
                Default unit: {product.defaultUnit}
              </Text>
            )}
          </View>
        </View>

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

      {/* Price Comparison */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          💰 Price Comparison
        </Text>
        <Text style={[styles.sectionSubtitle, {color: colors.textSecondary}]}>
          {allPrices.length > 0
            ? `Available at ${allPrices.length} shop${allPrices.length !== 1 ? 's' : ''}`
            : 'No prices recorded yet'}
        </Text>
      </View>

      {allPrices.length === 0 ? (
        <Card>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏷️</Text>
            <Text style={[styles.emptyTitle, {color: colors.text}]}>
              No prices yet
            </Text>
            <Text style={[styles.emptyDescription, {color: colors.textSecondary}]}>
              Edit this product to add prices at different shops
            </Text>
          </View>
        </Card>
      ) : (
        allPrices.map((item, index) => {
          const isCheapest = item.price === cheapestPrice;
          const savings = cheapestPrice ? item.price - cheapestPrice : 0;

          return (
            <Card
              key={item.shopProduct.id}
              onPress={() => navigation.navigate('ShopDetail', {shopId: item.shop.id})}>
              <View style={styles.priceCard}>
                <View style={styles.rankBadge}>
                  <Text
                    style={[
                      styles.rankText,
                      {color: isCheapest ? colors.success : colors.textSecondary},
                    ]}>
                    #{index + 1}
                  </Text>
                </View>
                <View style={styles.shopInfo}>
                  <Text style={[styles.shopName, {color: colors.text}]}>
                    {item.shop.name}
                  </Text>
                  <Text style={[styles.shopAddress, {color: colors.textSecondary}]}>
                    {item.shop.address || item.shop.category}
                  </Text>
                </View>
                <View style={styles.priceInfo}>
                  <Text
                    style={[
                      styles.price,
                      {color: isCheapest ? colors.success : colors.text},
                    ]}>
                    {formatPrice(item.price, state.settings.currency)}
                  </Text>
                  {isCheapest ? (
                    <View style={[styles.cheapestBadge, {backgroundColor: colors.success + '20'}]}>
                      <Text style={[styles.cheapestText, {color: colors.success}]}>
                        Cheapest
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.savingsText, {color: colors.error}]}>
                      +{formatPrice(savings, state.settings.currency)}
                    </Text>
                  )}
                </View>
              </View>
            </Card>
          );
        })
      )}

      {/* Quick Actions */}
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
          Added: {new Date(product.createdAt).toLocaleDateString()}
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
    marginBottom: 4,
  },
  unit: {
    fontSize: 13,
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
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 36,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
  },
  shopInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
  },
  shopAddress: {
    fontSize: 13,
    marginTop: 2,
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
  },
  cheapestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  cheapestText: {
    fontSize: 11,
    fontWeight: '600',
  },
  savingsText: {
    fontSize: 12,
    marginTop: 2,
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
