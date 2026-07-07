import type { NearestItem } from '../types';

const EARTH_RADIUS_KM = 6371;

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function findNearest<T extends { latitude: number; longitude: number }>(
  items: T[],
  lat: number,
  lng: number
): NearestItem<T> | null {
  if (!items.length) return null;

  let nearest: NearestItem<T> | null = null;

  for (const item of items) {
    const d = haversineDistance(lat, lng, item.latitude, item.longitude);
    if (!nearest || d < nearest.distanceKm) {
      nearest = { item, distanceKm: d };
    }
  }

  return nearest;
}

export function sortByDistance<T extends { latitude: number; longitude: number }>(
  items: T[],
  lat: number,
  lng: number
): NearestItem<T>[] {
  return items
    .map((item) => ({ item, distanceKm: haversineDistance(lat, lng, item.latitude, item.longitude) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function estimateWalkingTime(distanceKm: number): number {
  return Math.round((distanceKm / 5) * 60); // 5 km/h average walking speed
}

export function estimateDrivingTime(distanceKm: number): number {
  return Math.round((distanceKm / 30) * 60); // 30 km/h average in emergency
}
