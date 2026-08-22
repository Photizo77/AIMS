// src/config/geofence.ts
import type { GeofenceConfig } from '@/types';

/**
 * Nsambya Office Geofence Configuration
 * Coordinates: 0.3003° N, 32.5921° E
 * Radius: 150 meters
 */
export const OFFICE_GEOFENCE: GeofenceConfig = {
  latitude: 0.3003,
  longitude: 32.5921,
  radiusMeters: 150,
  label: 'Nsambya Office',
};

/**
 * Calculate distance between two coordinates using Haversine formula.
 * Returns distance in meters.
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if coordinates are within the office geofence.
 */
export function isWithinGeofence(lat: number, lng: number): boolean {
  const distance = haversineDistance(
    lat, lng,
    OFFICE_GEOFENCE.latitude, OFFICE_GEOFENCE.longitude
  );
  return distance <= OFFICE_GEOFENCE.radiusMeters;
}