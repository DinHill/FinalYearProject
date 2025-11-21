import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  GRADES: 'cache_grades',
  SCHEDULE: 'cache_schedule',
  ANNOUNCEMENTS: 'cache_announcements',
  DASHBOARD: 'cache_dashboard',
  COURSES: 'cache_courses',
  FINANCIAL_SUMMARY: 'cache_financial_summary',
  INVOICES: 'cache_invoices',
} as const;

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CachedData<T> {
  data: T;
  timestamp: number;
}

export async function cacheData<T>(key: string, data: T): Promise<void> {
  try {
    const cachedItem: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cachedItem));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const cachedItem: CachedData<T> = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - cachedItem.timestamp > CACHE_EXPIRY) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return cachedItem.data;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

export async function clearCache(key?: string): Promise<void> {
  try {
    if (key) {
      await AsyncStorage.removeItem(key);
    } else {
      // Clear all cache keys
      const keys = Object.values(CACHE_KEYS);
      await AsyncStorage.multiRemove(keys);
    }
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Clear all cache error:', error);
  }
}

export { CACHE_KEYS };

// Helper functions for specific data types
export const offlineCache = {
  grades: {
    set: (data: any) => cacheData(CACHE_KEYS.GRADES, data),
    get: () => getCachedData(CACHE_KEYS.GRADES),
  },
  schedule: {
    set: (data: any) => cacheData(CACHE_KEYS.SCHEDULE, data),
    get: () => getCachedData(CACHE_KEYS.SCHEDULE),
  },
  announcements: {
    set: (data: any) => cacheData(CACHE_KEYS.ANNOUNCEMENTS, data),
    get: () => getCachedData(CACHE_KEYS.ANNOUNCEMENTS),
  },
  dashboard: {
    set: (data: any) => cacheData(CACHE_KEYS.DASHBOARD, data),
    get: () => getCachedData(CACHE_KEYS.DASHBOARD),
  },
  courses: {
    set: (data: any) => cacheData(CACHE_KEYS.COURSES, data),
    get: () => getCachedData(CACHE_KEYS.COURSES),
  },
  financialSummary: {
    set: (data: any) => cacheData(CACHE_KEYS.FINANCIAL_SUMMARY, data),
    get: () => getCachedData(CACHE_KEYS.FINANCIAL_SUMMARY),
  },
  invoices: {
    set: (data: any) => cacheData(CACHE_KEYS.INVOICES, data),
    get: () => getCachedData(CACHE_KEYS.INVOICES),
  },
};
