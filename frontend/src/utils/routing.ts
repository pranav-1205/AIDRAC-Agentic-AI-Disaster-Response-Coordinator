import type { RouteInfo } from '../types';
import { haversineDistance } from './haversine';

const ORS_BASE = 'https://api.openrouteservice.org/v2/directions';
const OSRM_BASE = 'https://router.project-osrm.org/route/v1';

function getOrsKey(): string {
  return import.meta.env.VITE_ORS_API_KEY || '';
}

export async function getRoute(
  start: [number, number],
  end: [number, number]
): Promise<RouteInfo> {
  const apiKey = getOrsKey();

  if (apiKey) {
    try {
      return await routeViaORS(start, end, apiKey);
    } catch {
      return fallbackRoute(start, end);
    }
  }

  try {
    return await routeViaOSRM(start, end);
  } catch {
    return fallbackRoute(start, end);
  }
}

async function routeViaORS(
  start: [number, number],
  end: [number, number],
  apiKey: string
): Promise<RouteInfo> {
  const body = {
    coordinates: [
      [start[1], start[0]],
      [end[1], end[0]],
    ],
    instructions: true,
    geometry: true,
    format: 'geojson',
  };

  const res = await fetch(`${ORS_BASE}/foot-walking/geojson`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error('ORS request failed');

  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) throw new Error('ORS empty response');

  const props = feature.properties;
  const coords: [number, number][] = feature.geometry.coordinates.map(
    (c: number[]) => [c[1], c[0]]
  );
  const segments = props.segments?.[0] || {};
  const steps: string[] =
    segments.steps?.map((s: any) => s.instruction) || [];

  return {
    coordinates: coords,
    distanceKm: (segments.distance || 0) / 1000,
    durationMin: Math.round((segments.duration || 0) / 60),
    steps,
    provider: 'openrouteservice',
  };
}

async function routeViaOSRM(
  start: [number, number],
  end: [number, number]
): Promise<RouteInfo> {
  const url = `${OSRM_BASE}/foot/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('OSRM request failed');

  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('OSRM empty response');

  const coords: [number, number][] = route.geometry.coordinates.map(
    (c: number[]) => [c[1], c[0]]
  );
  const steps: string[] =
    route.legs?.[0]?.steps?.map((s: any) => s.instruction) || [];

  return {
    coordinates: coords,
    distanceKm: route.distance / 1000,
    durationMin: Math.round(route.duration / 60),
    steps,
    provider: 'osrm',
  };
}

function fallbackRoute(
  start: [number, number],
  end: [number, number]
): RouteInfo {
  const dist = haversineDistance(start[0], start[1], end[0], end[1]);
  const midpoint: [number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
  ];

  return {
    coordinates: [
      [start[0], start[1]],
      [midpoint[0], midpoint[1]],
      [end[0], end[1]],
    ],
    distanceKm: Math.round(dist * 100) / 100,
    durationMin: Math.round((dist / 5) * 60),
    steps: [
      `Head ${end[0] >= start[0] ? 'north' : 'south'} toward destination`,
      `Continue for ${dist.toFixed(1)} km`,
      `Arrive at destination`,
    ],
    provider: 'straight-line',
  };
}
