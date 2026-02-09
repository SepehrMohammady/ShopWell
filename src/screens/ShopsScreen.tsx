/**
 * Shops Screen
 */

import React from 'react';
import {View, FlatList, StyleSheet, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {RootStackParamList, Shop, ShopCategoryInfo} from '../types';
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
    const categoryColor = CategoryColors[item.category] || colors.other;
    const catInfo = ShopCategoryInfo[item.category];

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
              <Text style={[styles.categoryLabel, {color: colors.textSecondary}]}>
                {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
              </Text>
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

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <FlatList
        data={state.shops}
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});

export default ShopsScreen;
