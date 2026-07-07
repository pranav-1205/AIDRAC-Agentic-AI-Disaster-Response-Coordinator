import { useState, useEffect, useRef, useCallback } from 'react';
import type { GeolocationState, GeoPosition } from '../types';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

const defaults: UseGeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 5000,
  watch: true,
};

export function useGeolocation(options: UseGeolocationOptions = {}): GeolocationState & {
  refresh: () => void;
} {
  const opts = { ...defaults, ...options };
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: true,
    permissionDenied: false,
    unsupported: false,
  });
  const watchId = useRef<number | null>(null);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    const position: GeoPosition = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };
    setState({
      position,
      error: null,
      loading: false,
      permissionDenied: false,
      unsupported: false,
    });
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    setState((prev) => ({
      ...prev,
      loading: false,
      error:
        err.code === err.PERMISSION_DENIED
          ? 'No GPS permission'
          : err.code === err.TIMEOUT
          ? 'GPS request timed out'
          : 'GPS location unavailable',
      permissionDenied: err.code === err.PERMISSION_DENIED,
    }));
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        position: null,
        error: 'GPS not supported by this browser',
        loading: false,
        permissionDenied: false,
        unsupported: true,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    if (opts.watch) {
      watchId.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        { enableHighAccuracy: opts.enableHighAccuracy, timeout: opts.timeout, maximumAge: opts.maximumAge }
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        { enableHighAccuracy: opts.enableHighAccuracy, timeout: opts.timeout, maximumAge: opts.maximumAge }
      );
    }
  }, [opts.watch, opts.enableHighAccuracy, opts.timeout, opts.maximumAge, handleSuccess, handleError]);

  useEffect(() => {
    startWatching();
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [startWatching]);

  return { ...state, refresh: startWatching };
}
