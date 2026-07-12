/**
 * Shop Detail Screen
 */

import React from 'react';
import {View, StyleSheet, ScrollView, Text, TouchableOpacity} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {RootStackParamList, ShopCategoryInfo, getShopCategories} from '../types';
import {useApp} from '../context/AppContext';
import {useTheme} from '../context/ThemeContext';
import {Card, EmptyState, Button, useAlert} from '../components/common';
import {Spacing, FontSize, CategoryColors} from '../constants';
import {formatDate, getCurrentTimestamp, openDirections, hasNavigableLocation} from '../utils';
import {formatPrice, getCheaperAlternatives} from '../utils/priceHelper';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'ShopDetail'>;

const ShopDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const {state, updateShop, deleteShop, getProductsForShop} = useApp();
  const {colors} = useTheme();
  const {showAlert} = useAlert();

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
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.headerButton}>
              <Text style={[styles.deleteText, {color: '#E74C3C'}]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddEditShop', {shopId})}
              style={styles.headerButton}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [shop]);

  const handleDelete = () => {
    showAlert({
      title: 'Delete Shop',
      message: `Are you sure you want to delete "${shop?.name}"? This will also remove all product prices associated with this shop.`,
      buttons: [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteShop(shopId);
            navigation.goBack();
          },
        },
      ],
    });
  };

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

  const cats = getShopCategories(shop);
  const primary = cats[0];
  const categoryColor = CategoryColors[primary] || colors.other;

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
              <MaterialCommunityIcons name={ShopCategoryInfo[primary]?.icon || 'store'} size={28} color="#FFFFFF" />
            </View>
            <View style={styles.shopInfo}>
              <Text style={[styles.shopName, {color: colors.text}]}>{shop.name}</Text>
              <View style={styles.categoryChipsRow}>
                {cats.map(cat => {
                  const info = ShopCategoryInfo[cat] || ShopCategoryInfo.other;
                  const chipColor = CategoryColors[cat] || colors.other;
                  return (
                    <View key={cat} style={[styles.categoryChip, {backgroundColor: chipColor + '18'}]}>
                      <MaterialCommunityIcons name={info.icon} size={12} color={chipColor} />
                      <Text style={[styles.categoryChipText, {color: chipColor}]}>{info.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
            <TouchableOpacity
              onPress={handleToggleFavorite}
              style={styles.favoriteButton}>
              <MaterialCommunityIcons name={shop.isFavorite ? 'star' : 'star-outline'} size={28} color={shop.isFavorite ? '#FFB300' : colors.textLight} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Directions */}
        {hasNavigableLocation(shop) && (
          <TouchableOpacity
            style={[styles.directionsButton, {backgroundColor: colors.primary + '15', borderColor: colors.primary}]}
            onPress={() =>
              openDirections(
                {latitude: shop.latitude, longitude: shop.longitude, address: shop.address, label: shop.name},
                () => showAlert({title: 'Navigation', message: 'Could not open a map app on this device.'}),
              )
            }
            activeOpacity={0.7}>
            <MaterialCommunityIcons name="directions" size={20} color={colors.primary} />
            <Text style={[styles.directionsButtonText, {color: colors.primary}]}>Directions</Text>
          </TouchableOpacity>
        )}

        {/* Address */}
        {shop.address && (
          <Card>
            <View style={{flexDirection: 'row', alignItems: 'center'}}><MaterialCommunityIcons name="map-marker" size={16} color={colors.textSecondary} /><Text style={[styles.detailLabel, {color: colors.textSecondary, marginLeft: 4}]}>Address</Text></View>
            <Text style={[styles.detailValue, {color: colors.text}]}>{shop.address}</Text>
          </Card>
        )}

        {/* Additional Branches */}
        {shop.addresses && shop.addresses.length > 0 && (
          <>
            {shop.addresses.map((addr, index) => (
              <Card key={addr.id}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <MaterialCommunityIcons name="store-marker" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailLabel, {color: colors.textSecondary, marginLeft: 4}]}>
                    {addr.label || `Branch ${index + 1}`}
                  </Text>
                </View>
                {addr.address && (
                  <Text style={[styles.detailValue, {color: colors.text}]}>{addr.address}</Text>
                )}
                {addr.latitude && addr.longitude && (
                  <Text style={[{color: colors.textSecondary, fontSize: 12, marginTop: 2}]}>
                    📍 {addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}
                  </Text>
                )}
                {hasNavigableLocation(addr) && (
                  <TouchableOpacity
                    style={[styles.branchDirectionsButton, {borderColor: colors.primary}]}
                    onPress={() =>
                      openDirections(
                        {latitude: addr.latitude, longitude: addr.longitude, address: addr.address, label: addr.label || shop.name},
                        () => showAlert({title: 'Navigation', message: 'Could not open a map app on this device.'}),
                      )
                    }
                    activeOpacity={0.7}>
                    <MaterialCommunityIcons name="directions" size={16} color={colors.primary} />
                    <Text style={[styles.branchDirectionsText, {color: colors.primary}]}>Directions</Text>
                  </TouchableOpacity>
                )}
              </Card>
            ))}
          </>
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
  deleteText: {
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
  categoryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    gap: 3,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  favoriteButton: {
    padding: Spacing.sm,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: Spacing.base,
    gap: Spacing.sm,
  },
  directionsButtonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  branchDirectionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: Spacing.sm,
    gap: 4,
  },
  branchDirectionsText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
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
