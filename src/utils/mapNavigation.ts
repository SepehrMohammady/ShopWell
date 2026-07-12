/**
 * Open the device's map app with directions to a shop / branch.
 *
 * On Android a `geo:` intent is used so the OS routes to the user's own default
 * map app (Google Maps, Waze, OsmAnd, HERE, ...); on iOS Apple Maps is used.
 * If the preferred app can't handle it, we fall back to a universal Google Maps
 * directions URL (which opens the Maps app if installed, else the browser).
 */
import {Linking, Platform} from 'react-native';

export interface DirectionsTarget {
  latitude?: number;
  longitude?: number;
  address?: string;
  label?: string;
}

const hasCoords = (t: DirectionsTarget): boolean =>
  typeof t.latitude === 'number' &&
  typeof t.longitude === 'number' &&
  !isNaN(t.latitude) &&
  !isNaN(t.longitude);

/** True when there is enough info (coordinates or an address) to navigate to. */
export const hasNavigableLocation = (t: DirectionsTarget): boolean =>
  hasCoords(t) || !!(t.address && t.address.trim());

export const openDirections = (t: DirectionsTarget, onError?: () => void): void => {
  let primary: string;
  let fallback: string;

  if (hasCoords(t)) {
    const coords = `${t.latitude},${t.longitude}`;
    const label = (t.label || 'Destination').replace(/[()]/g, ' ').trim();
    primary = Platform.select({
      ios: `maps://?daddr=${coords}`,
      default: `geo:${coords}?q=${coords}(${encodeURIComponent(label)})`,
    }) as string;
    fallback = `https://www.google.com/maps/dir/?api=1&destination=${coords}`;
  } else if (t.address && t.address.trim()) {
    const q = encodeURIComponent(t.address.trim());
    primary = Platform.select({
      ios: `maps://?daddr=${q}`,
      default: `geo:0,0?q=${q}`,
    }) as string;
    fallback = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  } else {
    onError?.();
    return;
  }

  Linking.openURL(primary).catch(() =>
    Linking.openURL(fallback).catch(() => onError?.()),
  );
};
