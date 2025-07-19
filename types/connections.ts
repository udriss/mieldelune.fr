export interface PageVisit {
  page: string;
  timestamp: number;
  referrer?: string;
  title?: string;
}

export interface DeviceInfo {
  userAgent: string;
  screen: string;
  language: string;
  timezone: string;
  platform?: string;
  browser?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  userIp: string;
  location?: {
    country?: string;
    city?: string;
  };
}

export interface Connection {
  id: string;
  timestamp: number;
  deviceInfo: DeviceInfo;
  pagesVisited?: PageVisit[];
  lastActivity?: number;
  isActive: boolean;
  sessionDuration?: number;
}

export interface ConnectionStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  activeNow: number;
  uniqueIPs: number;
  avgSessionDuration: number;
  topPages: Array<{ page: string; visits: number }>;
  topCountries: Array<{ country: string; visits: number }>;
  deviceTypes: Array<{ type: string; count: number }>;
  browsers: Array<{ browser: string; count: number }>;
}
