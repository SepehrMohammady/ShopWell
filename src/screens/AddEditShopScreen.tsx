/**
 * Add/Edit Shop Screen
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, Shop, ShopCategory} from '../types';
import {useApp} from '../context/AppContext';
import {Button, Input, Card} from '../components/common';
import {Colors, Spacing, FontSize, CategoryColors} from '../constants';
import {generateId, getCurrentTimestamp} from '../utils';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'AddEditShop'>;

const categories: {id: ShopCategory; label: string; emoji: string}[] = [
  {id: 'grocery', label: 'Grocery', emoji: '🛒'},
  {id: 'pharmacy', label: 'Pharmacy', emoji: '💊'},
  {id: 'electronics', label: 'Electronics', emoji: '📱'},
  {id: 'clothing', label: 'Clothing', emoji: '👕'},
  {id: 'homeGoods', label: 'Home Goods', emoji: '🏠'},
  {id: 'other', label: 'Other', emoji: '🏪'},
];

const AddEditShopScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const {state, addShop, updateShop, deleteShop} = useApp();

  const shopId = route.params?.shopId;
  const existingShop = shopId
    ? state.shops.find(s => s.id === shopId)
    : undefined;

  const [name, setName] = useState(existingShop?.name || '');
  const [address, setAddress] = useState(existingShop?.address || '');
  const [category, setCategory] = useState<ShopCategory>(
    existingShop?.category || 'grocery',
  );
  const [notes, setNotes] = useState(existingShop?.notes || '');
  const [isFavorite, setIsFavorite] = useState(
    existingShop?.isFavorite || false,
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        existingShop ? (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.headerButton}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        ) : null,
    });
  }, [existingShop]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a shop name');
      return;
    }

    const now = getCurrentTimestamp();
    const shop: Shop = {
      id: existingShop?.id || generateId(),
      name: name.trim(),
      address: address.trim() || undefined,
      category,
      notes: notes.trim() || undefined,
      isFavorite,
      createdAt: existingShop?.createdAt || now,
      updatedAt: now,
    };

    if (existingShop) {
      updateShop(shop);
    } else {
      addShop(shop);
    }

    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Shop',
      'Are you sure you want to delete this shop?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteShop(shopId!);
            navigation.goBack();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Input
          label="Shop Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Walmart"
        />

        <Input
          label="Address (optional)"
          value={address}
          onChangeText={setAddress}
          placeholder="e.g., 123 Main Street"
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map(cat => {
            const isSelected = category === cat.id;
            const categoryColor = CategoryColors[cat.id] || Colors.other;

            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryItem,
                  isSelected && {
                    borderColor: categoryColor,
                    backgroundColor: `${categoryColor}15`,
                  },
                ]}
                onPress={() => setCategory(cat.id)}
                activeOpacity={0.7}>
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    isSelected && {color: categoryColor},
                  ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.favoriteRow}
          onPress={() => setIsFavorite(!isFavorite)}
          activeOpacity={0.7}>
          <Text style={styles.favoriteLabel}>Mark as Favorite</Text>
          <Text style={styles.favoriteIcon}>{isFavorite ? '⭐' : '☆'}</Text>
        </TouchableOpacity>

        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any notes about this shop..."
          multiline
          numberOfLines={3}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={existingShop ? 'Save Changes' : 'Add Shop'}
          onPress={handleSave}
          fullWidth
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.base,
    paddingBottom: 120,
  },
  headerButton: {
    paddingHorizontal: Spacing.base,
  },
  deleteText: {
    color: Colors.error,
    fontSize: FontSize.base,
    fontWeight: '500',
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
    marginBottom: Spacing.lg,
  },
  categoryItem: {
    width: '30%',
    marginHorizontal: '1.66%',
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  categoryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  favoriteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.base,
  },
  favoriteLabel: {
    fontSize: FontSize.base,
    color: Colors.text,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});

export default AddEditShopScreen;
