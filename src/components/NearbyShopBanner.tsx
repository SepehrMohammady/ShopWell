/**
 * NearbyShopBanner - In-app toast banner when user is near a shop
 * Replaces system push notifications with in-app proximity detection
 */

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useApp} from '../context/AppContext';
import {useTheme} from '../context/ThemeContext';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, Shop} from '../types';
import {getShopsInRange} from '../services/LocationService';
import {showLocalNotification, createShopNotification, shouldNotifyForShop} from '../services/NotificationService';
import {Spacing} from '../constants';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const CHECK_INTERVAL = 30000; // Check location every 30 seconds
const DISMISS_COOLDOWN = 10 * 60 * 1000; // Don't re-show for same shop for 10 minutes

const NearbyShopBanner: React.FC = () => {
  const {state} = useApp();
  const {colors} = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [nearbyShop, setNearbyShop] = useState<{shop: Shop; distance: number} | null>(null);
  const [dismissed, setDismissed] = useState<Map<string, number>>(new Map());
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkNearbyShops = useCallback(() => {
    if (!state.settings.locationNotificationsEnabled) return;

    const shopsWithLocation = state.shops.filter(
      s => s.latitude && s.longitude && s.notifyOnNearby && !s.isOnline,
    );
    if (shopsWithLocation.length === 0) return;

    Geolocation.getCurrentPosition(
      (position) => {
        const inRange = getShopsInRange(
          position.coords.latitude,
          position.coords.longitude,
          shopsWithLocation,
        );

        if (inRange.length > 0) {
          // Find closest shop that hasn't been dismissed recently
          const now = Date.now();
          const available = inRange.find(item => {
            const dismissedAt = dismissed.get(item.shop.id);
            return !dismissedAt || (now - dismissedAt > DISMISS_COOLDOWN);
          });

          if (available) {
            setNearbyShop(available);
            // Also fire a real system notification
            if (shouldNotifyForShop(available.shop.id)) {
              const notification = createShopNotification(available.shop, available.distance);
              showLocalNotification(notification);
            }
          }
        } else {
          setNearbyShop(null);
        }
      },
      () => {
        // Silently fail - don't bother user about location errors
      },
      {enableHighAccuracy: false, timeout: 10000, maximumAge: 30000},
    );
  }, [state.settings.locationNotificationsEnabled, state.shops, dismissed]);

  useEffect(() => {
    if (!state.settings.locationNotificationsEnabled) {
      setNearbyShop(null);
      return;
    }

    // Check immediately on mount
    checkNearbyShops();

    // Then check periodically
    intervalRef.current = setInterval(checkNearbyShops, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkNearbyShops, state.settings.locationNotificationsEnabled]);

  // Auto-open shop mode if setting is 'auto-open'
  useEffect(() => {
    if (nearbyShop && state.settings.nearbyShopAction === 'auto-open') {
      navigation.navigate('ShopMode', {shopId: nearbyShop.shop.id});
      handleDismiss();
    }
  }, [nearbyShop, state.settings.nearbyShopAction]);

  // Animate banner in/out
  useEffect(() => {
    if (nearbyShop && state.settings.nearbyShopAction === 'suggest') {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [nearbyShop, slideAnim, state.settings.nearbyShopAction]);

  const handleDismiss = () => {
    if (nearbyShop) {
      setDismissed(prev => new Map(prev).set(nearbyShop.shop.id, Date.now()));
    }
    setNearbyShop(null);
  };

  const handleOpenShop = () => {
    if (nearbyShop) {
      navigation.navigate('ShopMode', {shopId: nearbyShop.shop.id});
      handleDismiss();
    }
  };

  const formatDist = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  if (!nearbyShop || state.settings.nearbyShopAction === 'auto-open') return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.primary,
          transform: [{translateY: slideAnim}],
        },
      ]}>
      <TouchableOpacity style={styles.content} onPress={handleOpenShop} activeOpacity={0.8}>
        <MaterialCommunityIcons name="map-marker-radius" size={24} color="#FFFFFF" />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {nearbyShop.shop.name} is nearby!
          </Text>
          <Text style={styles.subtitle}>
            {formatDist(nearbyShop.distance)} away — tap to open shop mode
          </Text>
        </View>
        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <MaterialCommunityIcons name="close" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    paddingTop: Spacing.base,
  },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  dismissButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
});

export default NearbyShopBanner;
