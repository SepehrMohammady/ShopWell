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
import {useTheme} from '../context/ThemeContext';
import {Button, Input, Card} from '../components/common';
import {Spacing, FontSize, CategoryColors} from '../constants';
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
  const {colors} = useTheme();

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
  
  // Location fields
  const [latitude, setLatitude] = useState(
    existingShop?.latitude?.toString() || '',
  );
  const [longitude, setLongitude] = useState(
    existingShop?.longitude?.toString() || '',
  );
  const [geofenceRadius, setGeofenceRadius] = useState(
    existingShop?.geofenceRadius?.toString() || state.settings.defaultGeofenceRadius.toString(),
  );
  const [notifyOnNearby, setNotifyOnNearby] = useState(
    existingShop?.notifyOnNearby || false,
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

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radius = parseInt(geofenceRadius, 10);

    const now = getCurrentTimestamp();
    const shop: Shop = {
      id: existingShop?.id || generateId(),
      name: name.trim(),
      address: address.trim() || undefined,
      category,
      notes: notes.trim() || undefined,
      isFavorite,
      // Location fields
      latitude: !isNaN(lat) ? lat : undefined,
      longitude: !isNaN(lng) ? lng : undefined,
      geofenceRadius: !isNaN(radius) && radius > 0 ? radius : state.settings.defaultGeofenceRadius,
      notifyOnNearby: notifyOnNearby && !isNaN(lat) && !isNaN(lng),
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
    <View style={[styles.container, {backgroundColor: colors.background}]}>
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

        <Text style={[styles.label, {color: colors.text}]}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map(cat => {
            const isSelected = category === cat.id;
            const categoryColor = CategoryColors[cat.id] || colors.other;

            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryItem,
                  {backgroundColor: colors.surface, borderColor: colors.border},
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
                    {color: colors.textSecondary},
                    isSelected && {color: categoryColor},
                  ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.favoriteRow, {backgroundColor: colors.surface, borderColor: colors.border}]}
          onPress={() => setIsFavorite(!isFavorite)}
          activeOpacity={0.7}>
          <Text style={[styles.favoriteLabel, {color: colors.text}]}>Mark as Favorite</Text>
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

        {/* Location Section */}
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          📍 Location (optional)
        </Text>
        <Text style={[styles.sectionDescription, {color: colors.textSecondary}]}>
          Add coordinates to get notified when near this shop
        </Text>

        <View style={styles.coordinateRow}>
          <View style={styles.coordinateField}>
            <Input
              label="Latitude"
              value={latitude}
              onChangeText={setLatitude}
              placeholder="e.g., 45.4642"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.coordinateField}>
            <Input
              label="Longitude"
              value={longitude}
              onChangeText={setLongitude}
              placeholder="e.g., 9.1900"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {latitude && longitude && (
          <>
            <Input
              label="Notification radius (meters)"
              value={geofenceRadius}
              onChangeText={setGeofenceRadius}
              placeholder="200"
              keyboardType="number-pad"
            />

            <TouchableOpacity
              style={[
                styles.notifyRow,
                {
                  backgroundColor: notifyOnNearby ? colors.primary + '15' : colors.surface,
                  borderColor: notifyOnNearby ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setNotifyOnNearby(!notifyOnNearby)}
              activeOpacity={0.7}>
              <View style={styles.notifyContent}>
                <Text style={[styles.notifyLabel, {color: colors.text}]}>
                  Notify when nearby
                </Text>
                <Text style={[styles.notifyDescription, {color: colors.textSecondary}]}>
                  Get a notification when you're within {geofenceRadius || state.settings.defaultGeofenceRadius}m
                </Text>
              </View>
              <Text style={styles.notifyIcon}>{notifyOnNearby ? '🔔' : '🔕'}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, {backgroundColor: colors.surface, borderTopColor: colors.border}]}>
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
    fontSize: FontSize.base,
    fontWeight: '500',
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
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
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  categoryLabel: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  favoriteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing.base,
  },
  favoriteLabel: {
    fontSize: FontSize.base,
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
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.base,
  },
  coordinateRow: {
    flexDirection: 'row',
    marginHorizontal: -Spacing.xs,
  },
  coordinateField: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  notifyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: Spacing.base,
  },
  notifyContent: {
    flex: 1,
  },
  notifyLabel: {
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  notifyDescription: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  notifyIcon: {
    fontSize: 24,
    marginLeft: Spacing.base,
  },
});

export default AddEditShopScreen;
