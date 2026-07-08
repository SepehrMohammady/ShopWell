/**
 * Shops Screen
 */

import React, {useMemo} from 'react';
import {View, FlatList, StyleSheet, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {RootStackParamList, Shop, ShopCategoryInfo, getShopCategories} from '../types';
import {useApp} from '../context/AppContext';
import {useTheme} from '../context/ThemeContext';
import {Card, EmptyState, FAB} from '../components/common';
import {Spacing, FontSize, CategoryColors} from '../constants';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const ShopsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {state} = useApp();
  const {colors} = useTheme();

  const handleAddShop = () => {
    navigation.navigate('AddEditShop', {});
  };

  const handleShopPress = (shopId: string) => {
    navigation.navigate('ShopDetail', {shopId});
  };

  const renderShopItem = ({item}: {item: Shop}) => {
    const cats = getShopCategories(item);
    const primary = cats[0];
    const categoryColor = CategoryColors[primary] || colors.other;
    const catInfo = ShopCategoryInfo[primary] || ShopCategoryInfo.other;

    return (
      <Card onPress={() => handleShopPress(item.id)} elevated>
        <View style={styles.shopHeader}>
          <View style={styles.shopInfo}>
            <View
              style={[styles.categoryBadge, {backgroundColor: categoryColor}]}>
              <MaterialCommunityIcons name={catInfo.icon} size={24} color="#FFFFFF" />
            </View>
            <View style={styles.shopDetails}>
              <View style={styles.nameRow}>
                <Text style={[styles.shopName, {color: colors.text}]}>{item.name}</Text>
                {item.isFavorite && (
                  <MaterialCommunityIcons name="star" size={16} color="#FFD700" style={{marginLeft: Spacing.sm}} />
                )}
              </View>
              {item.address && (
                <View style={styles.metaRow}>
                  <MaterialCommunityIcons name="map-marker" size={14} color={colors.textSecondary} />
                  <Text style={[styles.shopAddress, {color: colors.textSecondary}]} numberOfLines={1}>
                    {item.address}
                    {item.addresses && item.addresses.length > 0
                      ? ` (+${item.addresses.length} branch${item.addresses.length !== 1 ? 'es' : ''})`
                      : ''}
                  </Text>
                </View>
              )}
              {item.isOnline && (
                <View style={styles.metaRow}>
                  <MaterialCommunityIcons name="web" size={14} color={colors.textSecondary} />
                  <Text style={[styles.shopAddress, {color: colors.textSecondary}]} numberOfLines={1}>
                    Online{item.url ? ` — ${item.url}` : ''}
                  </Text>
                </View>
              )}
              <View style={styles.categoryChipsRow}>
                {cats.map(cat => {
                  const info = ShopCategoryInfo[cat] || ShopCategoryInfo.other;
                  const chipColor = CategoryColors[cat] || colors.other;
                  return (
                    <View key={cat} style={[styles.categoryChip, {backgroundColor: chipColor + '18'}]}>
                      <MaterialCommunityIcons name={info.icon} size={11} color={chipColor} />
                      <Text style={[styles.categoryChipText, {color: chipColor}]}>{info.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  if (state.shops.length === 0) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <EmptyState
          icon="store"
          title="No Shops Yet"
          message="Add your favorite shops to quickly assign items and plan your shopping trips."
          actionLabel="Add Shop"
          onAction={handleAddShop}
        />
      </View>
    );
  }

  const sortedShops = useMemo(() =>
    [...state.shops].sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      return a.name.localeCompare(b.name);
    }),
    [state.shops],
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <FlatList
        data={sortedShops}
        renderItem={renderShopItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      <FAB onPress={handleAddShop} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: Spacing.base,
    paddingBottom: 100,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  favorite: {
    fontSize: FontSize.md,
    marginLeft: Spacing.sm,
  },
  shopAddress: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  categoryLabel: {
    fontSize: FontSize.xs,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  categoryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});

export default ShopsScreen;
