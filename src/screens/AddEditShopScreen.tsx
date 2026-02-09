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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from '@react-native-community/geolocation';
import {RootStackParamList, Shop, ShopCategory, ShopCategoryInfo} from '../types';
import {useApp} from '../context/AppContext';
import {useTheme} from '../context/ThemeContext';
import {Button, Input, Card} from '../components/common';
import {Spacing, FontSize, CategoryColors} from '../constants';
import {generateId, getCurrentTimestamp} from '../utils';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'AddEditShop'>;

const categories: ShopCategory[] = ['grocery', 'pharmacy', 'electronics', 'clothing', 'homeGoods', 'other'];

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
  const [isOnline, setIsOnline] = useState(existingShop?.isOnline || false);
  const [url, setUrl] = useState(existingShop?.url || '');

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
  const [isGettingLocation, setIsGettingLocation] = useState(false);

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

  const handleUseMyLocation = () => {
    setIsGettingLocation(true);
    Geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        setIsGettingLocation(false);
      },
      (error) => {
        Alert.alert('Error', 'Could not get your location. Please make sure location services are enabled.');
        setIsGettingLocation(false);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

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
      isOnline,
      url: isOnline ? url.trim() || undefined : undefined,
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

        <Text style={[styles.label, {color: colors.text}]}>Shop Type</Text>
        <View style={styles.shopTypeRow}>
          <TouchableOpacity
            style={[styles.shopTypeOption, {backgroundColor: !isOnline ? colors.primary : colors.surface, borderColor: !isOnline ? colors.primary : colors.border}]}
            onPress={() => setIsOnline(false)}>
            <MaterialCommunityIcons name="store" size={18} color={!isOnline ? colors.white : colors.text} />
            <Text style={[styles.shopTypeText, {color: !isOnline ? colors.white : colors.text}]}>Physical</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shopTypeOption, {backgroundColor: isOnline ? colors.primary : colors.surface, borderColor: isOnline ? colors.primary : colors.border}]}
            onPress={() => setIsOnline(true)}>
            <MaterialCommunityIcons name="web" size={18} color={isOnline ? colors.white : colors.text} />
            <Text style={[styles.shopTypeText, {color: isOnline ? colors.white : colors.text}]}>Online</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, {color: colors.text}]}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map(cat => {
            const isSelected = category === cat;
            const info = ShopCategoryInfo[cat];
            const categoryColor = CategoryColors[cat] || colors.other;

            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryItem,
                  {backgroundColor: colors.surface, borderColor: colors.border},
                  isSelected && {
                    borderColor: categoryColor,
                    backgroundColor: `${categoryColor}15`,
                  },
                ]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.7}>
                <MaterialCommunityIcons
                  name={info.icon}
                  size={24}
                  color={isSelected ? categoryColor : colors.textSecondary}
                  style={{marginBottom: Spacing.xs}}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    {color: colors.textSecondary},
                    isSelected && {color: categoryColor},
                  ]}>
                  {info.label}
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
          <MaterialCommunityIcons
            name={isFavorite ? 'star' : 'star-outline'}
            size={24}
            color={isFavorite ? '#FFD700' : colors.textSecondary}
          />
        </TouchableOpacity>

        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any notes about this shop..."
          multiline
          numberOfLines={3}
        />

        {isOnline ? (
          <Input
            label="Website URL"
            value={url}
            onChangeText={setUrl}
            placeholder="e.g., https://www.amazon.com"
            keyboardType="url"
          />
        ) : (
          <>
            {/* Location Section */}
            <Text style={[styles.sectionTitle, {color: colors.text}]}>
              <MaterialCommunityIcons name="map-marker" size={18} color={colors.text} /> Location (optional)
            </Text>
            <Text style={[styles.sectionDescription, {color: colors.textSecondary}]}>
              Add coordinates to get notified when near this shop
            </Text>

            <TouchableOpacity
              style={[styles.useLocationButton, {backgroundColor: colors.primary + '15', borderColor: colors.primary}]}
              onPress={handleUseMyLocation}
              disabled={isGettingLocation}>
              <MaterialCommunityIcons name="crosshairs-gps" size={20} color={colors.primary} />
              <Text style={[styles.useLocationText, {color: colors.primary}]}>
                {isGettingLocation ? 'Getting location...' : 'Use My Current Location'}
              </Text>
            </TouchableOpacity>

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
                  <MaterialCommunityIcons
                    name={notifyOnNearby ? 'bell' : 'bell-off'}
                    size={24}
                    color={notifyOnNearby ? colors.primary : colors.textSecondary}
                    style={{marginLeft: Spacing.base}}
                  />
                </TouchableOpacity>
              </>
            )}
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
  shopTypeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  shopTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  shopTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  useLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.base,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  useLocationText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AddEditShopScreen;
