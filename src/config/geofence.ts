// src/config/geofence.ts
import type { GeofenceConfig } from '@/types';

/**
 * ARDHI Office Geofence Configuration
 * Coordinates: 53.35222°N, -7.20167°E (Latitude: 53.35222 | Longitude: -7.20167)
 * Radius: 200 metres
 */
export const OFFICE_GEOFENCE: GeofenceConfig = {
  latitude: 53.35222,
  longitude: -7.20167,
  radiusMeters: 200,
  label: 'ARDHI Office (200m geofence)',
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

// ── Office network verification (IP-based presence) ──
// Some devices (or the office environment) cannot provide reliable GPS.
// Being on the ARDHI office LAN — office router/gateway is 192.168.100.1,
// so office clients sit on 192.168.100.x — counts as verified on-site
// presence. Update the prefixes if the office subnet ever changes.
export const OFFICE_NETWORK_PREFIXES: string[] = ['192.168.100.'];

export function matchesOfficeNetwork(ip: string): boolean {
  return OFFICE_NETWORK_PREFIXES.some((prefix) => ip.startsWith(prefix));
}

/**
 * Detect the browser's local IPv4 addresses (WebRTC ICE trick).
 * Some browsers return an obfuscated mDNS hostname instead of an IP —
 * in that case the array is empty and callers fall back to GPS.
 */
export function detectLocalIPv4s(timeoutMs = 2500): Promise<string[]> {
  return new Promise((resolve) => {
    const found = new Set<string>();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { pc.close(); } catch { /* ignore */ }
      resolve(Array.from(found));
    };
    let pc: RTCPeerConnection;
    try {
      pc = new RTCPeerConnection({ iceServers: [] });
    } catch {
      resolve([]);
      return;
    }
    pc.onicecandidate = (e) => {
      const cand = e.candidate?.candidate ?? '';
      // IPv4 addresses appear on host/srflx candidates, e.g. 192.168.100.23
      const m = cand.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
      if (m && !m[1].startsWith('127.')) found.add(m[1]);
      if (!e.candidate) finish();
    };
    pc.createDataChannel('aims-netcheck');
    pc.createOffer()
      .then((o) => pc.setLocalDescription(o))
      .catch(() => finish());
    window.setTimeout(finish, timeoutMs);
  });
}