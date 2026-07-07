import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { weatherApi } from '../services/api';
import type { Weather, GeoPosition } from '../types';

const REFRESH_INTERVAL = 5 * 60 * 1000;

interface UseWeatherResult {
  weather: Weather | null;
  loading: boolean;
  error: string | null;
}

export function useWeather(position: GeoPosition | null): UseWeatherResult {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!position) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await weatherApi.get(position.lat, position.lng);
        setWeather(res.data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.detail || err.message);
        } else {
          setError('Failed to fetch weather');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();

    intervalRef.current = setInterval(fetchWeather, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [position?.lat, position?.lng]);

  return { weather, loading, error };
}
