import type { RouteInfo } from '../types';

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
    return await routeViaORS(start, end, apiKey);
  }

  return await routeViaOSRM(start, end);
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
    segments.steps?.map((s: any) => {
      const instruction = s.instruction || '';
      const dist = s.distance ? ` (${Math.round(s.distance)} m)` : '';
      if (instruction.toLowerCase().includes('arrive')) {
        return 'Destination will be on your right.';
      }
      return `${instruction}${dist}`;
    }) || [];

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
    route.legs?.[0]?.steps?.map((s: any) => {
      const dist = s.distance ? ` (${Math.round(s.distance)} m)` : '';
      if (s.maneuver?.instruction) {
        const instr = s.maneuver.instruction;
        if (instr.toLowerCase().includes('arrive') || s.maneuver.type === 'arrive') {
          return 'Destination will be on your right.';
        }
        return `${instr}${dist}`;
      }
      const type = s.maneuver?.type || 'continue';
      const mod = s.maneuver?.modifier || '';
      const name = s.name || '';
      if (type === 'arrive') return 'Destination will be on your right.';
      const dir: Record<string, string> = {
        turn:           `Turn ${mod}${name ? ` onto ${name}` : ''}`,
        'new name':     `Continue${name ? ` onto ${name}` : ''}`,
        continue:       name ? `Continue onto ${name}` : 'Continue',
        depart:         `Head ${mod}${name ? ` ${name}` : ''}`,
        arrive:         'Destination will be on your right.',
        'end of road':  `Turn ${mod} at end of road${name ? ` onto ${name}` : ''}`,
        roundabout:     `Enter roundabout${name ? ` onto ${name}` : ''}`,
        fork:           `Keep ${mod} at fork${name ? ` onto ${name}` : ''}`,
        merge:          `Merge ${mod}${name ? ` onto ${name}` : ''}`,
        rotary:         `Enter rotary${name ? ` onto ${name}` : ''}`,
        'exit roundabout': name ? `Exit roundabout onto ${name}` : 'Exit roundabout',
        'exit rotary':  name ? `Exit rotary onto ${name}` : 'Exit rotary',
      };
      return `${dir[type] || `Continue${name ? ` onto ${name}` : ''}`}${dist}`;
    }) || [];

  return {
    coordinates: coords,
    distanceKm: route.distance / 1000,
    durationMin: Math.round(route.duration / 60),
    steps,
    provider: 'osrm',
  };
}


